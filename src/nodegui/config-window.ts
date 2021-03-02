import {NodeWidget} from "@nodegui/nodegui/dist/lib/QtWidgets/QWidget";
import {YamlConfigWriter} from "./yaml-config-writer";
import {setNodeWidgetValue} from "./form-utility";
import {AppWindow} from "../windows/window";

/**
 * A window that needs to read or write data to a configuration file
 */
export abstract class ConfigMainWindow<T> extends AppWindow {
    protected config: T | null = null
    protected configManager: YamlConfigWriter<T> | undefined

    protected constructor(configManager: YamlConfigWriter<T>|null = null) {
        super()
        this.config = this.readConfig()
        if (configManager) {
            this.configManager = configManager
        }
    }

    protected getConfigManager(): YamlConfigWriter<T> {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.configManager!
    }

    // Ensure current config is loaded when window is shown
    public show(): void {
        this.config = this.readConfig()
        super.show()
    }

    public injectConfigSetting<T extends NodeWidget<any>>(instance: T, configKey: string): T {
        instance.setObjectName(configKey)
        setNodeWidgetValue(instance, this.getConfigManager().getSetting(configKey))
        return instance
    }

    protected abstract readConfig(): T
}
