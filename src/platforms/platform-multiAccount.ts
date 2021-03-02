import {Platform} from "./platform";
import {MultiAccountPlatformSettingsWindow} from "../windows/settings-multiAccountPlatform";
import {YamlConfigWriter} from "../nodegui/yaml-config-writer";
import {Account} from "../config";
import {AppWindow} from "../windows/window";

export abstract class MultiAccountPlatform<T extends Account> extends Platform<T> {
    public abstract formatAccountForList(account: Account): string;

    public getSettingsWindow(configManager: YamlConfigWriter<any>): AppWindow {
        return new MultiAccountPlatformSettingsWindow(this, configManager)
    }
}
