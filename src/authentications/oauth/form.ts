import {AccountForm} from "../form";
import {Account} from "../../config";
import {QGridLayout, QLabel, QPushButton, QWidget, TextFormat, WidgetEventTypes} from "@nodegui/nodegui";
import open from "open";
import {Token} from "client-oauth2";
import {setPassword} from "keytar";
import {logger} from "../../logger";
import {OAuthServer} from "../../oauth/server";
import {Platform} from "../../platforms/platform";
import {OAuthAuthentication} from "./oauth";
import {OAuthSettingsWindow} from "./settings";

export class OAuthForm<T extends Account> extends AccountForm<T> {
    protected authentication: OAuthAuthentication<T>;

    constructor(authentication: OAuthAuthentication<T>) {
        super(authentication);
        this.authentication = authentication;
    }

    getCurrentAccount(platform: Platform<T>): T|null {
        const accounts = platform.getAccountRepository().findAll().filter((a) => a.authentication === "oauth2")
        if (!accounts.length) {
            return null
        }
        return accounts[0]
    }

    getForm(platform: Platform<T>): QWidget {
        const oAuthServer = new OAuthServer<T>(platform, this.account)

        const rootView = new QWidget();
        const grid = new QGridLayout()
        rootView.setLayout(grid)

        const buttonOpen = new QPushButton()
        const buttonClose = new QPushButton()
        buttonOpen.addEventListener('clicked', () => {
            oAuthServer.start()

            const em = oAuthServer.getEventEmitter();
            em.addListener('started', async (startUrl: string) => {
                await open(startUrl)
            })
            em.addListener('oauth_granted', async (token: Token) => {
                // Save token
                const tmpAccount: T = {authentication: 'oauth2', username: 'OAuth', account: platform.id} as T
                // --- START
                // Remove this when the node module saves the expiry date as date
                // @see https://github.com/mulesoft-labs/js-client-oauth2/issues/157#issuecomment-826320729
                token.data.update_time = new Date().toString()
                // --- END
                await setPassword(tmpAccount.account, tmpAccount.username, JSON.stringify(token.data))

                // Get account name
                this.authentication.getAccountName(tmpAccount)
                    .then((userName) => {
                        // Update current account if found, else create new account
                        const account: T = this.getCurrentAccount(platform) ?? platform.getAccount(this.authentication)
                        account.account = platform.id
                        account.username = userName
                        platform.getAccountRepository().update(account, tmpAccount, JSON.stringify(token.data)).then(() => {
                            em.emit('stop')
                            label2.setText('Connected account: <i>' + userName + '</i>')
                            this.em.emit('accountSaved', platform.id, account, this.account)
                        }).catch((error: Error) => {
                            logger.error(`Unable to save OAuth token (${platform.id}}: ${error.message}`)
                            // todo: Alert error
                        });
                    })
                    .catch((error: Error) => {
                        logger.error(`Unable to get user details for OAuth (${platform.id}): ${error.message}`)
                    });
            })
        })
        buttonOpen.setText(`Authenticate ${platform.name} account`)

        const buttonOauthSettings = new QPushButton()
        buttonOauthSettings.setText('OAuth2 settings')
        buttonOauthSettings.addEventListener("clicked", () => {
            const settingsWindow = new OAuthSettingsWindow<T>(this.authentication, platform, this.account);
            (global as any).oAuthsettingsWin = settingsWindow; // To prevent win from being garbage collected.
            settingsWindow.addEventListener(WidgetEventTypes.Close, () => delete (global as any).oAuthsettingsWin)
            settingsWindow.show()
        })

        const label = new QLabel()
        label.setText(`Please authenticate access to your ${platform.name} account via OAuth.`)
        grid.addWidget(label, 0, 0, 1, 2)

        const label2 = new QLabel()
        label2.setTextFormat(TextFormat.RichText)
        const account = this.getCurrentAccount(platform) || {username: '-'}
        label2.setText('Connected account: <i>' + account.username + '</i>')
        grid.addWidget(label2, 1, 0, 1, 2)

        grid.addWidget(buttonOpen, 2, 0)
        grid.addWidget(buttonOauthSettings, 2, 1)

        buttonClose.setText('Close window')
        buttonClose.addEventListener('clicked', () => this.em.emit('closeWindow'))
        grid.addWidget(buttonClose, 3, 0,  1, 2);

        this.addEventListener(WidgetEventTypes.Close, () => {
            buttonOpen.setEnabled(true)
            oAuthServer.getEventEmitter().emit('stop')
        })
        return rootView;
    }
}
