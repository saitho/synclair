import {
    QGridLayout,
    QIcon,
    QLabel,
    QTabWidget,
    QWidget,
    TextFormat,
    TextInteractionFlag
} from "@nodegui/nodegui";
import {Platform} from "../platforms/platform";
import {Account} from "../config";
import {logger} from "../logger";
import EventEmitter from "events";
import {Status, statusMap} from "../status";
import {resolveQIcon} from "../utils";
import {AppWindow} from "./window";

interface Settings<T extends Account> {
    accountToEdit?: T;
    displayDeleteButton?: boolean
}

export class AccountWindow<T extends Account> extends AppWindow {
    protected em = new EventEmitter()

    public initialize(platform: Platform<T>, settings?: Settings<T>): void {
        // Reset EventEmitter
        this.em = new EventEmitter();
        if (settings && settings.accountToEdit) {
            this.setWindowTitle("Edit account")
        } else {
            this.setWindowTitle("Add account")
        }

        const tab = new QTabWidget()
        for (const auths of platform.getAuthentications()) {
            const widget = new QWidget()
            const authScreen = new QGridLayout()

            let rowCounter = 0;
            if (auths.getAccountCreationNote().length) {
                const text = new QLabel()
                text.setText(auths.getAccountCreationNote())
                text.setTextFormat(TextFormat.RichText);
                text.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
                text.setOpenExternalLinks(true)
                authScreen.addWidget(text, rowCounter, 0, 1, 0)
                rowCounter++
            }

            const form = auths.getForm(true)
            form.setAccount(settings?.accountToEdit || null)

            form.getEventEmitter().addListener('saveAccount', (platformId: string, newAccount: T, oldAccount?: T) => {
                const passwordVal = auths.getPasswordValue()

                let promise;
                if (oldAccount) {
                    promise = platform.getAccountRepository().update(newAccount, oldAccount, passwordVal)
                } else {
                    promise = platform.getAccountRepository().create(newAccount, passwordVal)
                }

                promise
                    .then(() => {
                        this.em.emit(
                            settings?.accountToEdit ? 'accountEdited' : 'accountAdded',
                            platformId,
                            newAccount,
                            oldAccount
                        );
                        this.em.emit(
                            'accountSaved',
                            platformId,
                            newAccount,
                            oldAccount
                        )
                    })
                    .catch((error: Error) => {
                        logger.error(`Unable to save new account.`)
                        this.em.emit('accountError', error)
                    });
            })
            form.getEventEmitter().addListener('closeWindow', () => {
                this.close()
            })

            authScreen.addWidget(form.getForm(platform), rowCounter)

            widget.setLayout(authScreen)
            const tabActive = settings && settings.accountToEdit && settings.accountToEdit.authentication === auths.id

            let icon = new QIcon()
            if (tabActive) {
                icon = resolveQIcon(statusMap.get(Status.ONLINE)?.icon as string)
            }
            const index = tab.addTab(widget, icon, auths.name)
            form.setTabIndex(index, this)
            if (tabActive) {
                tab.setCurrentIndex(index)
            }
        }

        this.em.addListener('updateActiveTab', (tabIndex: number) => {
            for (const index in tab.tabs) {
                let icon = new QIcon()
                if (Number(index) === tabIndex) {
                    icon = resolveQIcon(statusMap.get(Status.ONLINE)?.icon as string)
                    tab.setCurrentIndex(Number(index))
                }
                tab.setTabIcon(Number(index), icon)
            }
        })

        this.setCentralWidget(tab)
    }

    public getEventEmitter(): EventEmitter {
        return this.em;
    }
}
