import {
    Direction,
    EchoMode,
    QBoxLayout,
    QGridLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QRadioButton,
    QWidget,
    TextFormat,
} from "@nodegui/nodegui";
import {Config, getConfigPath, OAuthAccount, readConfig} from "../../config";
import {YamlConfigWriter} from "../../nodegui/yaml-config-writer";
import {ConfigMainWindow} from "../../nodegui/config-window";
import {QHorizontalLine} from "../../nodegui/widgets/QHorizontalLine";
import {OAuthAuthentication} from "./oauth";
import {Platform} from "../../platforms/platform";
import * as keytar from "keytar";

export class OAuthSettingsWindow<T extends OAuthAccount> extends ConfigMainWindow<Config> {
    protected authentication: OAuthAuthentication<T>
    protected platform: Platform<T>
    protected account: T|null;

    constructor(authentication: OAuthAuthentication<T>, platform: Platform<T>, account: T|null) {
        super(new YamlConfigWriter<Config>(getConfigPath()));
        this.authentication = authentication;
        this.platform = platform;
        this.account = account;

        const hasCustomOAuthApp = this.authentication.hasCustomOAuthApp(this.account)

        this.setWindowTitle('OAuth2 settings')
        this.setMinimumSize(400, 300)

        const rootView = new QWidget();
        this.setCentralWidget(rootView);
        const grid = new QBoxLayout(Direction.TopToBottom)
        rootView.setLayout(grid)

        const customOAuthWidget = new QWidget()
        const grid2 = new QGridLayout()
        customOAuthWidget.setLayout(grid2)

        const inputOAuthClientId = new QLineEdit()
        const inputOAuthClientIdLabel = new QLabel()
        inputOAuthClientIdLabel.setText('OAuth2 Client ID')
        if (hasCustomOAuthApp) {
            inputOAuthClientId.setText(this.account?.oAuthClientId as string)
        }
        grid2.addWidget(inputOAuthClientIdLabel, 0, 0)
        grid2.addWidget(inputOAuthClientId, 0, 1)

        const inputOAuthClientSecret = new QLineEdit()
        const inputOAuthClientSecretLabel = new QLabel()
        inputOAuthClientSecret.setEchoMode(EchoMode.Password)
        inputOAuthClientSecretLabel.setText('OAuth2 Client Secret')
        grid2.addWidget(inputOAuthClientSecretLabel, 1, 0)
        grid2.addWidget(inputOAuthClientSecret, 1, 1)

        function updateCustomFields(enabled: boolean) {
            inputOAuthClientId.setEnabled(enabled)
            inputOAuthClientSecret.setEnabled(enabled)
        }

        const radioWidget = new QWidget()
        const gridRadio = new QBoxLayout(Direction.TopToBottom)
        gridRadio.setSpacing(0)
        radioWidget.setLayout(gridRadio)

        const radioDefault = new QRadioButton()
        radioDefault.setText('Default OAuth2 app')
        radioDefault.setChecked(!hasCustomOAuthApp)
        const radioDefaultLabel = new QLabel()
        radioDefaultLabel.setTextFormat(TextFormat.RichText)
        radioDefaultLabel.setOpenExternalLinks(true)
        radioDefaultLabel.setText('Uses lcl.ovh for resolving the OAuth challenge (<a href="https://lcl.ovh">privacy policy</a>)')

        gridRadio.addWidget(radioDefault)
        gridRadio.addWidget(radioDefaultLabel)
        gridRadio.addWidget(new QHorizontalLine())

        const radioCustom = new QRadioButton()
        radioCustom.setText('Custom OAuth2 app')
        radioCustom.setChecked(hasCustomOAuthApp)
        gridRadio.addWidget(radioCustom)
        const radioCustomLabel = new QLabel()
        radioCustomLabel.setTextFormat(TextFormat.RichText)
        radioCustomLabel.setOpenExternalLinks(true)
        if (this.authentication.getOAuthSettings().customOAuthInstructions) {
            const text = this.authentication.getOAuthSettings().customOAuthInstructions as string
            radioCustomLabel.setText(text.replace('###REDIRECT_URL###', OAuthAuthentication.getOAuthRedirectUri(this.platform)))
        }

        if (this.authentication.isCustomOAuthAppAllowed()) {
            gridRadio.addWidget(radioCustomLabel)

            updateCustomFields(radioCustom.isChecked())
            radioDefault.addEventListener('clicked', () => updateCustomFields(false))
            radioCustom.addEventListener('clicked', () => updateCustomFields(true))
        } else {
            radioCustom.hide()
        }
        grid.addWidget(radioWidget)
        if (this.authentication.isCustomOAuthAppAllowed()) {
            grid.addWidget(customOAuthWidget)
        }

        const saveButton = new QPushButton()
        saveButton.setText('Save and close')
        saveButton.addEventListener("clicked", async () => {
            if (!this.authentication.isCustomOAuthAppAllowed()) {
                this.close()
                return;
            }

            let account = this.account;
            if (account === null) {
                account = this.platform.getAccount(this.authentication)
            }
            // Remove existing OAuth credentials
            const credService = 'customoauth-' + platform.id
            const credentials = await keytar.findCredentials(credService)
            for (const cred of credentials) {
                await keytar.deletePassword(credService, cred.account)
            }

            if (radioDefault.isChecked()) {
                delete account.oAuthClientId
            } else {
                const oAuthClientId = inputOAuthClientId.text()
                const oAuthSecret = inputOAuthClientSecret.text()

                if (!oAuthClientId.length) {
                    // todo: error
                    return;
                }
                if (!oAuthSecret.length) {
                    // todo: error
                    return;
                }

                account.oAuthClientId = oAuthClientId
                await keytar.setPassword(credService, oAuthClientId, oAuthSecret)
            }
            platform.getAccountRepository().update(account, this.account as T)
                .then(() => {
                    this.close()
                })
                .catch(() => {
                    // todo: error
                })
        })
        grid.addWidget(saveButton)

        const closeButton = new QPushButton()
        closeButton.setText('Abort and close')
        closeButton.addEventListener("clicked", () => {
            this.close()
        })
        grid.addWidget(closeButton)
    }

    protected readConfig(): Config {
        return readConfig();
    }
}
