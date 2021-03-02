import {
    Direction,
    QAction,
    QBoxLayout,
    QCheckBox, QComboBox,
    QGridLayout,
    QGroupBox,
    QKeySequence, QLabel,
    QPushButton,
    QWidget, WidgetEventTypes
} from "@nodegui/nodegui";
import {Status, statusMap} from "../status";
import {platforms} from "../services";
import {resolveQIcon} from "../utils";
import {Config, getConfigPath, readConfig} from "../config";
import {NodeWidget, QWidgetSignals} from "@nodegui/nodegui/dist/lib/QtWidgets/QWidget";
import {YamlConfigWriter} from "../nodegui/yaml-config-writer";
import {ConfigMainWindow} from "../nodegui/config-window";

class SettingsWindow extends ConfigMainWindow<Config> {
    constructor() {
        super(new YamlConfigWriter<Config>(getConfigPath()));

        this.setWindowTitle('Settings')
        this.setMinimumSize(400, 300)

        const rootView = new QWidget();
        this.setCentralWidget(rootView);
        const grid = new QGridLayout()
        rootView.setLayout(grid)

        const {widget, data} = this.createApplicationSettingsGroup();
        grid.addWidget(widget, 0, 0)
        grid.addWidget(this.createServiceSettingsGroup(), 1, 0)
        grid.addWidget(this.createFormButtons(data), 2, 0, 1, 0)
    }

    protected readConfig(): Config {
        return readConfig();
    }

    protected createApplicationSettingsGroup(): { widget: QGroupBox, data: NodeWidget<any>[]} {
        const vbox = new QBoxLayout(Direction.TopToBottom);

        const groupBox = new QGroupBox();
        groupBox.setTitle("Application settings")

        const launchStartupCheckBox = this.injectConfigSetting<QCheckBox>(new QCheckBox(), 'settings.launchOnStartup');
        launchStartupCheckBox.setText("Launch application on startup")
        //vbox.addWidget(launchStartupCheckBox);

        const label = new QLabel()
        label.setText("Status after launch")
        let defaultStatusBox = new QComboBox();
        for (const status of Array.from(statusMap.values())) {
            defaultStatusBox.addItem(undefined, status.name)
        }
        // Note: we need to instantiate the ComboBox first with all items before injecting the config setting
        defaultStatusBox = this.injectConfigSetting<QComboBox>(defaultStatusBox, 'settings.statusAfterLaunch');
        vbox.addWidget(label);
        vbox.addWidget(defaultStatusBox);

        const updateServiceAfterLaunchCheckbox = this.injectConfigSetting<QCheckBox>(new QCheckBox(), 'settings.updateStatusOnLaunch');
        updateServiceAfterLaunchCheckbox.setText("Update status on connected services after launch")
        vbox.addWidget(updateServiceAfterLaunchCheckbox);

        groupBox.setLayout(vbox);

        return {
            widget: groupBox,
            data: [
                launchStartupCheckBox,
                defaultStatusBox,
                updateServiceAfterLaunchCheckbox
            ]
        }
    }

    protected createServiceSettingsGroup(): QGroupBox {
        if (!this.configManager) {
            throw new Error("Missing config manager!")
        }
        const groupBox = new QGroupBox();
        groupBox.setTitle("Service settings")

        const vbox = new QBoxLayout(Direction.LeftToRight)
        for (const platform of platforms) {
            const serviceButton = new QPushButton();
            serviceButton.setText(platform.name)
            serviceButton.setIcon(resolveQIcon(platform.icon))
            serviceButton.addEventListener('clicked', () => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const window = platform.getSettingsWindow(this.configManager!)
                window.show();
                (global as any).serviceWindow = window;
                window.addEventListener(WidgetEventTypes.Close, () => {
                    delete (global as any).serviceWindow;
                })
            })
            vbox.addWidget(serviceButton);

        }
        groupBox.setLayout(vbox);

        return groupBox;
    }

    protected createFormButtons(data: NodeWidget<QWidgetSignals>[]) {
        const pushButton = new QPushButton();
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const win = this;
        pushButton.addEventListener('clicked', () => {
            this.getConfigManager().updateAndPersist(data)
            win.close()
        })
        pushButton.setText("Save and close")

        const vbox = new QBoxLayout(Direction.TopToBottom);
        vbox.addWidget(pushButton);

        const widget = new QWidget();
        widget.setLayout(vbox)
        return widget;
    }
}

const win = new SettingsWindow();
(global as any).settingsWin = win; // To prevent win from being garbage collected.

export const settingsAction = new QAction();
settingsAction.setText("Settings...");
settingsAction.setShortcut(new QKeySequence("Alt+S"));
settingsAction.addEventListener("triggered", () => {
    win.show()
    win.raise()
    win.activateWindow()
});
