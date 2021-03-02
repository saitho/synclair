import lodashMerge from "lodash.merge";
import {NodeWidget, QWidgetSignals} from "@nodegui/nodegui/dist/lib/QtWidgets/QWidget";
import fs from "fs";
import YAML from "yaml";
import {getNodeWidgetValue} from "./form-utility";

/**
 * This class writes the results of given NodeGUI elements into a YAML file.
 * The position in the yaml file is determined by the object name.
 * Saving a text "bar" of an input field with object name "settings.foo" as object name would place the value at:
 *
 * settings:
 *   foo: bar
 */
export class YamlConfigWriter<T> {
    protected yamlFilePath: string;

    constructor(yamlFilePath: string) {
        this.yamlFilePath = yamlFilePath;
    }

    public load(): T {
        const file = fs.readFileSync(this.yamlFilePath, 'utf8')
        return YAML.parse(file) as T
    }

    public getSetting<T>(yamlPath: string, defaultValue: T | null = null): T | null {
        const splitPath = yamlPath.split('.')
        let setting: any = this.load()
        for (const path of splitPath) {
            if (!Object.prototype.hasOwnProperty.call(setting, path)) {
                return defaultValue;
            }
            setting = setting[path]
        }
        return setting;
    }

    public persist(config: T): void {
        fs.writeFileSync(this.yamlFilePath, YAML.stringify(config))
    }

    public update(data: NodeWidget<QWidgetSignals>[]): T {

        let config: any = this.load();

        for (const dataChunk of data) {
            const updatedConfig = this.getUpdatedConfigSetting(
                dataChunk.objectName(),
                getNodeWidgetValue(dataChunk)
            )
            config = lodashMerge<any, any>(config, updatedConfig)
        }
        return config
    }

    public updateAndPersist(data: NodeWidget<QWidgetSignals>[]): void {
        const updatedConfig = this.update(data)
        this.persist(updatedConfig)
    }

    protected getUpdatedConfigSetting<T>(configKey: string, configValue: T): any {
        const splitObjectName = configKey.split('.').reverse()
        let configObject: any = {}
        for (const i in splitObjectName) {
            if (!Number(i)) {
                configObject[splitObjectName[i]] = configValue;
            } else {
                const oldConfig = configObject
                configObject = {}
                configObject[splitObjectName[i]] = oldConfig
            }
        }
        return configObject;
    }
}
