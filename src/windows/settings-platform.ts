import {ConfigMainWindow} from "../nodegui/config-window";
import {Account, Config, readConfig} from "../config";
import {Platform} from "../platforms/platform";
import EventEmitter from "events";
import {YamlConfigWriter} from "../nodegui/yaml-config-writer";
import {AccountRepository} from "../repositories/account";

export abstract class PlatformSettingsWindow<T extends Platform<Account>> extends ConfigMainWindow<Config> {
    protected platform: T;
    protected em: EventEmitter = new EventEmitter();
    protected accountRepository: AccountRepository<any>;

    protected constructor(platform: T, configManager: YamlConfigWriter<any>) {
        super(configManager);
        this.platform = platform;
        this.accountRepository = this.platform.getAccountRepository(configManager)

        this.setWindowTitle(this.platform.name + ' settings')
        this.setMinimumSize(500, 300)
    }

    protected readConfig(): any {
        return readConfig()
    }
}
