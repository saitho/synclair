import {ButtonRole, QMessageBox, QPushButton, QWidget} from "@nodegui/nodegui";
import {Account} from "../config";
import {Platform} from "../platforms/platform";
import EventEmitter from "events";
import {Authentication} from "./authentication";
import {AccountWindow} from "../windows/account";

export abstract class AccountForm<T extends Account> extends QWidget {
    protected account: T|null = null;
    protected em: EventEmitter = new EventEmitter()
    protected authentication: Authentication<T, AccountForm<T>>;
    protected tabIndex = -1;
    protected accountWindow: AccountWindow<T>|null = null;

    protected constructor(authentication: Authentication<T, AccountForm<T>>) {
        super();
        this.authentication = authentication;

        this.em.addListener('accountSaved', () => {
            if (this.accountWindow) {
                this.accountWindow.getEventEmitter().emit('updateActiveTab', this.tabIndex)
            }
            this.close()
        })
    }

    protected displayErrorMessage(errorMessage: string): void
    {
        const messageBox = new QMessageBox();
        messageBox.setText(errorMessage);
        messageBox.setWindowTitle('Oops, an error occurred!')
        const accept = new QPushButton();
        accept.setText('OK');
        messageBox.addButton(accept, ButtonRole.AcceptRole);
        messageBox.exec()
    }

    public abstract getForm(platform: Platform<T>): QWidget;

    public setTabIndex(tabIndex: number, accountWindow: AccountWindow<T>): void {
        this.tabIndex = tabIndex
        this.accountWindow = accountWindow
    }

    public setAccount(account: T|null): void {
        this.account = account;
    }

    public getEventEmitter(): EventEmitter {
        return this.em;
    }
}
