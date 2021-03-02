import {Account, Config} from "../config";
import {Platform} from "../platforms/platform";
import {YamlConfigWriter} from "../nodegui/yaml-config-writer";
import * as keytar from "keytar";
import {MultiAccountPlatform} from "../platforms/platform-multiAccount";

export class AccountRepository<T extends Account> {
    protected configManager: YamlConfigWriter<Config>
    protected platform: Platform<T>

    constructor(configManager: YamlConfigWriter<Config>, platform: Platform<T>) {
        this.configManager = configManager
        this.platform = platform
    }

    protected getConfigWithServiceCheck(serviceName: string): Config {
        const config = this.configManager?.load()
        if (!config) {
            throw new Error("Unable to load config.")
        }

        if (!config.services) {
            config.services = {}
        }
        if (!Object.prototype.hasOwnProperty.call(config.services, serviceName)) {
            config.services[serviceName] = null
        }

        return config
    }

    public async create(account: T, password: string): Promise<void> {
        const serviceName: string = this.platform.id
        const config = this.getConfigWithServiceCheck(serviceName);
        if (!config.services) {
            throw new Error("Unable to update service configurations")
        }
        if (config.services[serviceName] == null) {
            config.services[serviceName] = []
        }
        (config.services[serviceName] as Account[]).push(account)
        await keytar.setPassword(account.account, account.username, password)

        // Persist account data
        this.configManager?.persist(config)
    }

    public async update(account: T, oldAccount?: T, newPassword: string|null = null): Promise<void> {
        const serviceName = this.platform.id
        const config = this.getConfigWithServiceCheck(serviceName);
        const oldAccountId = oldAccount?.account

        // Update existing data in array
        if (this.platform instanceof MultiAccountPlatform) {
            if (!config.services) {
                config.services = {}
            }
            if (!Object.prototype.hasOwnProperty.call(config.services, serviceName)) {
                config.services[serviceName] = []
            }
            const accounts = config.services[serviceName] as Account[]
            for (const key in accounts) {
                if (accounts[key].account !== oldAccountId) {
                    continue;
                }
                accounts[key] = account
                break;
            }
            config.services[serviceName] = accounts
        } else {
            if (!config.services) {
                config.services = {}
            }
            config.services[serviceName] = account
        }

        // Save password
        if (newPassword) {
            // Remove old password if exists
            if (oldAccount != undefined && oldAccountId && oldAccountId != account.account) {
                await keytar.deletePassword(oldAccountId, oldAccount.username)
            }

            await keytar.setPassword(account.account, account.username, newPassword)
        }

        // Persist account data
        this.configManager.persist(config)
    }

    public async delete(account: T): Promise<boolean> {
        const serviceName = this.platform.id
        const config = this.getConfigWithServiceCheck(serviceName);

        if (this.platform instanceof MultiAccountPlatform) {
            if (!Object.prototype.hasOwnProperty.call(config.services, serviceName) || !Array.isArray((config.services as any)[serviceName])) {
                return false;
            }

            for (const i in (config.services as any)[serviceName] as Account[]) {
                if (((config.services as any)[serviceName][i] as Account).account === account.account) {
                    (config.services as any)[serviceName].splice(i, 1);
                    break;
                }
            }
        } else {
            if (!Object.prototype.hasOwnProperty.call(config, serviceName) || !Object.keys((config.services as any)[serviceName]).length) {
                return false;
            }
            await keytar.deletePassword(account.account, account.username);
            if (config.services) {
                (config.services[serviceName] as any) = {}
            }
        }

        this.configManager.persist(config);
        return true
    }

    public find(accountId: string): T|null {
        return this.findAll().filter((a) => a.account === accountId)[0];
    }

    public findAll(): T[] {
        if (!this.configManager) {
            return []
        }
        if (this.platform instanceof MultiAccountPlatform) {
            const settings = this.configManager.getSetting<T[]>('services.' + this.platform.id)
            return settings ?? []
        }
        const setting = this.configManager.getSetting<T>('services.' + this.platform.id)
        return setting ? [setting] : []
    }
}
