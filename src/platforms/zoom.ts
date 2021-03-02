import {OAuthAccount} from "../config";
import {SingleAccountPlatform} from "./platform-singleAccount";
import {OAuthAuthentication, RequestValidation} from "../authentications/oauth/oauth";
import {JwtAuthentication} from "../authentications/jwt/jwt";
import {Status} from "../status";
import {Authentication} from "../authentications/authentication";
import {logger} from "../logger";
import zoomApi, {UpdatePresenceStatusBody} from "zoomapi"
import {getPassword} from "keytar";
import {getNodeWidgetValue} from "../nodegui/form-utility";
import {AccountForm} from "../authentications/form";
import {AxiosResponse} from "axios";
import notify from "node-notifier";

export interface ZoomAccount extends OAuthAccount {
    lastUpdate: number;
}

export class Zoom extends SingleAccountPlatform<ZoomAccount> {
    constructor() {
        super();

        const validateRequest = (account: ZoomAccount) => {
            return new Promise<RequestValidation>((resolve) => {
                const sinceLastUpdate = Date.now()-account.lastUpdate
                if (sinceLastUpdate < 60000) {
                    // Retry
                    const retryTimer = 60000 - sinceLastUpdate + 500
                    logger.info(`Zoom update for account "${account.username}" delayed due to rate limit. Retrying in ${retryTimer} ms`)
                    notify.notify({
                        title: '[Zoom] Update delayed',
                        message: `Rate limit for Zoom API reached.\r\nYour status will be updated in ${Math.ceil(retryTimer/1000)} seconds.`
                    });
                    resolve({action: "retry", retry_time: retryTimer})
                } else {
                    resolve({action: "pass"})
                }
            });
        };

        this.authentications = [
            new JwtAuthentication({
                accountCreationNote: 'Please <a href="https://marketplace.zoom.us/develop/create">create a new JWT app</a> on your personal Zoom account. Then enter the API Key and Secret below.<br/><br/>Please note that your Zoom status can only be updated every 60 seconds!',
                endpoints: {
                    updateStatus: {
                        validateRequest: validateRequest,
                        execute: (platform, account, statusId) => {
                            return new Promise<void>((resolve, reject) => {
                                getPassword(account.account, account.username)
                                    .then((password) => {
                                        const client = zoomApi({
                                            apiKey: account.username,
                                            apiSecret: password as string
                                        })

                                        // TODO: store last update timestamp in data
                                        // A user’s status can not be updated more than once per minute,
                                        //   i.e., you can only submit a maximum of 1 update request/minute for a single user.
                                        const params: UpdatePresenceStatusBody = {
                                            status: 'Available'
                                        }
                                        if (statusId == 1) {
                                            params.status = 'Away'
                                        } else if (statusId == 2) {
                                            // todo: setting DnD not always available via API?!
                                            params.status = 'Do_Not_Disturb'
                                            params.duration = 1440
                                        }
                                        client.users.UpdatePresenceStatus('me', params)
                                            .then(() => {
                                                const updatedAccount = Object.assign(account, {lastUpdate: Date.now()})
                                                this.accountRepository?.update(updatedAccount, account)
                                                    .then(() => {
                                                        logger.info(`Updated status for Zoom account "${account.username}"`)
                                                        resolve()
                                                    })
                                                    .catch((error) => {
                                                        logger.error(`Unable to update lastUpdate time on Zoom account "${account.username}"`)
                                                        reject(error)
                                                    })
                                            })
                                            .catch((error: Error) => {
                                                logger.error(`Unable to update status for Zoom account (ID: ${account.account}): ${error}"`)
                                                error.message = '[Zoom] ' + error.message
                                                reject(error)
                                            })
                                    })
                                    .catch(reject)
                            })
                        }
                    },
                    validateCredentials: {
                        execute: (platform, account, password) => {
                            return new Promise<void>((resolve) => {
                                const client = zoomApi({
                                    apiKey: account.username,
                                    apiSecret: password
                                })
                                client.users.GetUser('me')
                                    .then(() => {
                                        logger.info(`Validated Zoom account "${account.username}"`)
                                        resolve()
                                    })
                                    .catch((error: Error) => {
                                        logger.error(`Unable to validate Zoom account (ID: ${account.account}): ${error}"`)
                                        resolve()
                                    })
                            })
                        }
                    }
                }
            }),
            new OAuthAuthentication(
                this,
                {
                allowCustomOAuthApp: true,
                customOAuthInstructions: '<ol>' +
                    '<li>Log into your Zoom account and <a href="https://marketplace.zoom.us/develop/create">create</a> a new OAuth application or <a href="https://marketplace.zoom.us/user/build">use an existing one</a></li>' +
                    '<li>Set the <i>Redirect URL</i> to <b>###REDIRECT_URL###</b></li>' +
                    '<li>Set the <i>Whitelist URL</i> to <b>http://localhost:4114</b></li>' +
                    '<li>Set the <i>Scope</i> to <b>user:write</b></li>' +
                    '<li>Enter the <i>Client ID</i> and <i>Client Secret</i> (Development context) below.</li>' +
                    '</ol>',
                oAuthOptions: {
                    clientId: 'MGbzU37aS3CWZHxLogzdnQ',
                    clientSecret: 'BkdU8eN4dExfSFOgn8CaN2ho43jjiZIQ',
                    accessTokenUri: 'https://zoom.us/oauth/token',
                    authorizationUri: 'https://zoom.us/oauth/authorize',
                    redirectUri: 'https://statusupdater.lcl.ovh/oauth/zoom/verify/',
                    scopes: ['user:write']
                },
                endpoints: {
                    getUsername: {
                        url: 'https://api.zoom.us/v2/users/me',
                        method: "get",
                        processResponse: (r: AxiosResponse) => {
                            return new Promise<string>((resolve) => {
                                const {first_name, last_name, email} = r.data;
                                const fullName = (first_name + ' ' + last_name).trim() || ''
                                resolve(fullName.length ? fullName + ' (' + email + ')' : email)
                            })
                        }
                    },
                    updateStatus: {
                        url: 'https://api.zoom.us/v2/users/me/presence_status',
                        method: "put",
                        buildParams: (account: ZoomAccount, statusId: Status): Promise<any> => {
                            return new Promise<any>((resolve) => {
                                const params: {status: string, duration?: number} = {
                                    status: 'Available'
                                }
                                if (statusId == 1) {
                                    params.status = 'Away'
                                } else if (statusId == 2) {
                                    // todo: setting DnD not always available via API?!
                                    params.status = 'Do_Not_Disturb'
                                    params.duration = 1440
                                }
                                resolve(params)
                            });
                        },
                        validateRequest: validateRequest,
                        processResponse: (r, account) => {
                            // A user’s status can not be updated more than once per minute,
                            //   i.e., you can only submit a maximum of 1 update request/minute for a single user.
                            return new Promise<void>((resolve, reject) => {
                                const updatedAccount = Object.assign(account, {lastUpdate: Date.now()})
                                this.accountRepository?.update(updatedAccount, account)
                                    .then(() => {
                                        resolve()
                                    })
                                    .catch((error) => {
                                        logger.error(`Unable to update lastUpdate time on Zoom account "${account.username}"`)
                                        reject(error)
                                    })
                            })
                        }
                    }
                }
            })
        ]
    }

    public get id(): string {
        return "zoom";
    }

    public get name(): string {
        return "Zoom";
    }

    public get icon(): string {
        return require('../../assets/images/zoom-icon.png');
    }

    public get logo(): string {
        return require('../../assets/images/zoom-icon.png');
    }

    getAccount(auth: Authentication<ZoomAccount, AccountForm<ZoomAccount>>): ZoomAccount {
        if (auth instanceof JwtAuthentication) {
            const fields = auth.getForm().getFields()
            const usernameField = fields.get('username')
            if (!usernameField) {
                throw new Error("Missing apiKey field")
            }
            const usernameVal = getNodeWidgetValue(usernameField.instance) as string
            return {authentication: 'jwt', username: usernameVal, account: 'zoom', lastUpdate: 0};
        } else if (auth instanceof OAuthAuthentication) {
            return {authentication: 'oauth2', username: '', account: '', lastUpdate: 0};
        }
        return {authentication: '', username: '', account: '', lastUpdate: 0};
    }
}
