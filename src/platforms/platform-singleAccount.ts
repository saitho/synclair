import {Platform} from "./platform";
import {YamlConfigWriter} from "../nodegui/yaml-config-writer";
import {AccountWindow} from "../windows/account";
import {Account} from "../config";
import {AppWindow} from "../windows/window";

export abstract class SingleAccountPlatform<T extends Account> extends Platform<T> {
    public getSettingsWindow(configManager: YamlConfigWriter<any>): AppWindow {
        const accountWindow = new AccountWindow<T>()
        accountWindow.initialize(this, {
            accountToEdit: this.getAccountRepository(configManager).findAll()[0],
            displayDeleteButton: true
        })
        return accountWindow
    }
}
