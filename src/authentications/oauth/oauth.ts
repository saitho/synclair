import ClientOAuth2, {Token} from "client-oauth2";
import {OAuthAccount} from "../../config";
import axios, {AxiosError, AxiosResponse, Method} from "axios";
import {getPassword, setPassword} from "keytar";
import {logger} from "../../logger";
import {Platform} from "../../platforms/platform";
import {OAuthForm} from "./form";
import {Authentication, AuthSettings} from "../authentication";
import {Status} from "../../status";
import * as keytar from "keytar";

export interface RequestValidation {
    action: "pass"|"abort"|"retry";
    retry_time?: number;
}

interface OAuthEndpointUpdateStatus<T extends OAuthAccount> {
    url: string;
    method: Method;
    processResponse?: (r: AxiosResponse, account: T) => Promise<void>;
    processError?: (r: AxiosError) => Promise<void>;
    buildParams: (account: T, statusId: Status) => Promise<any>;
    validateRequest?: (account: T, statusId: Status) => Promise<RequestValidation>; // Return true to continue request, false to abort request silently
}

export interface OAuthSettings<T extends OAuthAccount> {
    oAuthOptions: ClientOAuth2.Options;
    allowCustomOAuthApp?: boolean;
    customOAuthInstructions?: string;
    endpoints: {
        updateStatus: OAuthEndpointUpdateStatus<T>
        getUsername: {
            url: string;
            method: Method;
            processResponse: (r: AxiosResponse, account: T) => Promise<string>;
            processError?: (r: AxiosError) => Promise<void>;
        }
    }
}

export class OAuthAuthentication<T extends OAuthAccount> extends Authentication<T, OAuthForm<T>> {
    private readonly oAuthClient: ClientOAuth2;
    protected settings: OAuthSettings<T> & AuthSettings<T>;
    protected platform: Platform<T>;

    constructor(platform: Platform<T>, settings: OAuthSettings<T> & AuthSettings<T>) {
        super(settings)
        this.settings = settings
        this.oAuthClient = new ClientOAuth2(settings.oAuthOptions)
        this.platform = platform;
    }

    public getOAuthSettings(): OAuthSettings<T> {
        return this.settings
    }

    public isCustomOAuthAppAllowed(): boolean {
        return this.settings.allowCustomOAuthApp || false;
    }

    public newForm(): OAuthForm<T> {
        return new OAuthForm(this)
    }

    public getPasswordValue(): string {
        throw new Error("Method not implemented.");
    }

    public getAccountName(account: T): Promise<string> {
        const endpointSettings = this.settings.endpoints.getUsername
        return new Promise<string>((resolve, reject) => {
            this.doOAuthRequest(
                account,
                endpointSettings.method,
                endpointSettings.url,
                {}
            ).then((r) => {
                endpointSettings.processResponse(r, account)
                    .then(resolve)
                    .catch(reject)
            }).catch(async (error) => {
                if (endpointSettings.processError) {
                    await endpointSettings.processError(error)
                }
                reject(error)
            })
        });
    }

    get id(): string {
        return 'oauth2';
    }

    get name(): string {
        return 'OAuth2';
    }

    /**
     * Authenticate a new account
     * @param platform
     * @param account
     * @param statusId
     */
    protected callUpdateStatus(platform: Platform<T>, account: T, statusId: Status): Promise<void> {
        const endpointSettings = this.settings.endpoints.updateStatus
        return new Promise<void>((resolve, reject) => {
            endpointSettings.buildParams(account,statusId)
                .then(async (params) => {
                    this.doOAuthRequest(
                        account,
                        endpointSettings.method,
                        endpointSettings.url,
                        params
                    ).then(async (r) => {
                        logger.info(`Updated status for ${platform.id} account "${account.username}"`)
                        if (endpointSettings.processResponse) {
                            await endpointSettings.processResponse(r, account)
                        }
                        resolve()
                    }).catch(async (error: AxiosError) => {
                        logger.error(`Unable to update status for ${platform.id} account (ID: ${account.account}): ${error.response?.data.message}"`)
                        error.message = `[${platform.name}] ${error.response?.data.message}`
                        if (endpointSettings.processError) {
                            await endpointSettings.processError(error)
                        }
                        reject(error)
                    })
                }).catch(reject)
        })
    }

    public hasCustomOAuthApp(account: T|null): boolean {
        if (!account) {
            return false;
        }
        return account.oAuthClientId !== undefined && (account.oAuthClientId as string).length > 0
    }

    public async doOAuthRequest(account: T, method: Method, url: string, data: any = {}): Promise<AxiosResponse> {
        const tokenData = await getPassword(account.account, account.username) as string
        const client = (await this.getOAuthClient(account))
        const parsedTokenData = JSON.parse(tokenData)

        let token = new Token(client, parsedTokenData)

        // --- START
        // Update expiry date as the saved value is only in seconds
        // Remove this when the node module saves the expiry date as date
        // @see https://github.com/mulesoft-labs/js-client-oauth2/issues/157#issuecomment-826320729
        if (parsedTokenData.update_time) {
            const realExpiryData = new Date(parsedTokenData.update_time)
            const expiresIn = parseInt(token.data.expires_in) || 0;
            realExpiryData.setSeconds(realExpiryData.getSeconds() + expiresIn)
            token.expiresIn(realExpiryData)
        }
        // --- END

        if (token.expired()) {
            token = await token.refresh()
            // --- START
            // Remove this when the node module saves the expiry date as date
            // @see https://github.com/mulesoft-labs/js-client-oauth2/issues/157#issuecomment-826320729
            token.data.update_time = new Date().toString()
            // --- END

            // Save updated token
            await setPassword(account.account, account.username, JSON.stringify(token.data))
            logger.info('OAuth2 token for platform ' + this.platform.id + ' (Account: ' + account.username + ') expired so it was renewed.')
        }

        return axios.request({
            method: method,
            url: url,
            data: data,
            headers: {
                'Authorization': token.tokenType +' '+ token.accessToken
            }
        })
    }

    public async getOauthAuthorizeUrl(account: T|null): Promise<string> {
        return (await this.getOAuthClient(account)).code.getUri()
    }

    /**
     * Returns the localhost redirect Uri for the given platform
     * @param platform
     */
    public static getOAuthRedirectUri<T extends OAuthAccount>(platform: Platform<T>): string {
        return 'http://localhost:4114/oauth/' + platform.id + '/verify/'
    }

    protected async getOAuthClient(account: T|null): Promise<ClientOAuth2> {
        if (account && this.hasCustomOAuthApp(account) && this.isCustomOAuthAppAllowed()) {
            const credService = 'customoauth-' + this.platform.id
            const credentials = await keytar.findCredentials(credService)
            return new ClientOAuth2({
                ...this.settings.oAuthOptions,
                clientId: credentials[0].account,
                clientSecret: credentials[0].password,
                redirectUri: OAuthAuthentication.getOAuthRedirectUri(this.platform)
            })
        }
        return this.oAuthClient
    }

    public getOauthToken(account: T|null, originalUrl: string): Promise<Token> {
        return new Promise<Token>((resolve, reject) => {
            this.getOAuthClient(account)
                .then((client) => {
                    client.code.getToken(originalUrl)
                        .then(function (user) {
                            // Refresh the current users access token.
                            user.refresh().then(function (updatedUser) {
                                resolve(updatedUser)
                            }).catch(reject)
                        })
                })
                .catch(reject)
        })
    }
}
