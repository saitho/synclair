import {AccountForm} from "./form";
import {Account} from "../config";
import {Platform} from "../platforms/platform";
import {Status} from "../status";
import {logger} from "../logger";
import {RequestValidation} from "./oauth/oauth";
import { setTimeout } from 'timers';

export interface AuthEndpointUpdateStatus<T extends Account> {
    execute?: (platform: Platform<T>, account: T, statusId: Status) => Promise<void>;
    validateRequest?: (account: T, statusId: Status) => Promise<RequestValidation>; // Return true to continue request, false to abort request silently
}
export interface AuthEndpointValidateCredentials<T extends Account> {
    execute?: (platform: Platform<T>, account: T, password: string) => Promise<void>;
}

export interface AuthSettings<T extends Account> {
    accountCreationNote?: string;
    endpoints?: {
        updateStatus?: AuthEndpointUpdateStatus<T>;
    }
}

export abstract class Authentication<T extends Account, F extends AccountForm<T>> {
    protected form: F = this.newForm();
    protected settings: AuthSettings<T>;
    public abstract get id(): string;
    public abstract get name(): string;
    public abstract getPasswordValue(): string;

    protected static timeouts: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>()

    public abstract newForm(): F;
    public getForm(reset = false): F {
        if (reset) {
            this.form = this.newForm()
        }
        return this.form
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected callValidateCredentials(platform: Platform<T>, account: T, password: string): Promise<void> {
        throw new Error('Authentication needs to implement the method "callValidateCredentials" or provide the setting "endpoints.validateCredentials.execute".');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected callUpdateStatus(platform: Platform<T>, account: T, statusId: Status): Promise<void> {
        throw new Error('Authentication needs to implement the method "callUpdateStatus" or provide the setting "endpoints.updateStatus.execute".');
    }

    protected constructor(settings: AuthSettings<T>) {
        this.settings = settings
    }

    public getAccountCreationNote(): string {
        return this.settings.accountCreationNote || ''
    }

    protected updateStatusPreCheck(platform: Platform<T>, account: T, statusId: Status): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.settings.endpoints?.updateStatus?.validateRequest) {
                resolve(true)
                return
            }
            this.settings.endpoints.updateStatus.validateRequest(account, statusId)
                .then((validateRequest) => {
                    if (validateRequest.action === "retry") {
                        if (validateRequest.retry_time === undefined) {
                            validateRequest.retry_time = 5;
                        }
                        if (Authentication.timeouts.has(account.account)) {
                            const timeout = Authentication.timeouts.get(account.account)
                            if (timeout) {
                                logger.debug(`Cleared timed update for account ${account.account}`)
                                clearTimeout(timeout)
                            }
                        }

                        logger.debug(`Scheduled timed update for account ${account.account} in ${validateRequest.retry_time}ms`)
                        const timeout = setTimeout(
                            () => {
                                Authentication.timeouts.delete(account.account)
                                logger.debug(`Executed timed update for account ${account.account}`)
                                this.updateStatus(platform, account, statusId)
                            },
                            validateRequest.retry_time
                        )
                        Authentication.timeouts.set(account.account, timeout)
                        resolve(false);
                        return;
                    }
                    resolve(true);
                })
                .catch(reject)
        })
    }

    public async updateStatus(platform: Platform<T>, account: T, statusId: Status): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.updateStatusPreCheck(platform, account, statusId)
                .then((continueRequest: boolean) => {
                    if (!continueRequest) {
                        // Abort silently
                        return;
                    }
                    if (this.settings.endpoints?.updateStatus?.execute) {
                        logger.info(`[${platform.name}] Update account via endpoint`)
                        return this.settings.endpoints.updateStatus.execute(platform, account, statusId);
                    }
                    logger.info(`[${platform.name}] Update account via authentication`)
                    this.callUpdateStatus(platform, account, statusId)
                        .then(resolve)
                        .catch(reject)
                })
        })
    }
}
