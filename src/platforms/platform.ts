import {Account, Config, getConfigPath} from "../config";
import {YamlConfigWriter} from "../nodegui/yaml-config-writer";
import {AccountRepository} from "../repositories/account";
import {Authentication} from "../authentications/authentication";
import {logger} from "../logger";
import {AccountForm} from "../authentications/form";
import {AppWindow} from "../windows/window";

export enum AuthType {
    BASIC = 0,
    OAUTH2 = 1,
}

export abstract class Platform<T extends Account> {
    protected settingsWindow: AppWindow|null = null;
    protected accountRepository: AccountRepository<T>|null = null;

    protected authentications: Authentication<T, AccountForm<T>>[] = [];

    public getAuthentications(): Authentication<T, AccountForm<T>>[] {
        return this.authentications
    }

    public getAuthenticationForAccount(account: T): Authentication<T, AccountForm<T>> {
        return this.getAuthentications().filter((a) => a.id === account.authentication)[0]
    }

    public abstract getAccount(auth: Authentication<T, AccountForm<T>>): T;
    public abstract get id(): string;
    public abstract get name(): string;
    public abstract get icon(): string;
    public abstract get logo(): string;
    public abstract getSettingsWindow(configManager: YamlConfigWriter<any>): AppWindow;

    /**
     * This notice will be shown above the account create/edit form
     */
    public getAccountCreationNote(): string {
        // No note per default, may be overridden by actual platforms
        return ''
    }

    public getAccountRepository(configManager: YamlConfigWriter<Config>|null = null): AccountRepository<T> {
        if (!this.accountRepository) {
            if (!configManager) {
                configManager = new YamlConfigWriter<Config>(getConfigPath());
            }
            this.accountRepository = new AccountRepository<T>(configManager, this)
        }
        return this.accountRepository
    }

    public async updateStatusAll(statusId: number): Promise<any> {
        const accounts = this.getAccountRepository().findAll()
        logger.info(`Updating ${accounts.length} accounts for platform "${this.name}"`)
        const promises = []
        for (const account of accounts) {
            if (!account.username.length || !account.account.length) {
                continue
            }
            promises.push(this.getAuthenticationForAccount(account).updateStatus(this, account, statusId))
        }
        return Promise.all(promises)
    }
}
