import {FormField, getNodeWidgetValue} from "../nodegui/form-utility";
import {EchoMode, QLineEdit} from "@nodegui/nodegui";
import {Account} from "../config";
import {MultiAccountPlatform} from "./platform-multiAccount";
import {BasicAuthentication} from "../authentications/basic/basic";
import {MattermostBasicAuthentication} from "./authentications/mattermost-basic";
import {Authentication} from "../authentications/authentication";
import {AccountForm} from "../authentications/form";
import {MattermostPATAuthentication} from "./authentications/mattermost-pat";

export interface MattermostAccount extends Account {
    server: string;
}

export class Mattermost extends MultiAccountPlatform<MattermostAccount> {
    constructor() {
        super();

        const basicPasswordInput = new QLineEdit()
        basicPasswordInput.setEchoMode(EchoMode.Password)

        const basicAuthFieldsMap = new Map<string, FormField>()
        basicAuthFieldsMap.set('username', {label: 'Username', instance: new QLineEdit()})
        basicAuthFieldsMap.set('password', {label: 'Password', instance: basicPasswordInput})
        basicAuthFieldsMap.set('server', {
            label: 'Server-URL',
            instance: new QLineEdit(),
            options: ['text-password'],
            formatFunc: (value: string): string => {
                return value;
            },
            validateFunc: (value: string): boolean => {
                return value.startsWith('http')
            }
        })

        const patPasswordInput = new QLineEdit()
        patPasswordInput.setEchoMode(EchoMode.Password)
        const patAuthFieldsMap = new Map<string, FormField>()
        patAuthFieldsMap.set('password', {label: 'Personal Access Token', instance: patPasswordInput})
        patAuthFieldsMap.set('server', {
            label: 'Server-URL',
            instance: new QLineEdit(),
            options: ['text-password'],
            formatFunc: (value: string): string => {
                return value;
            },
            validateFunc: (value: string): boolean => {
                return value.startsWith('http')
            }
        })
        this.authentications = [
            new MattermostBasicAuthentication({
                fields: basicAuthFieldsMap
            }),
            new MattermostPATAuthentication({
                fields: patAuthFieldsMap
            })
        ]
    }

    public get id(): string {
        return "mattermost";
    }

    public get name(): string {
        return "Mattermost";
    }

    public get icon(): string {
        return require('../../assets/images/mattermost-icon.png');
    }

    public get logo(): string {
        return require('../../assets/images/mattermost-icon.png');
    }

    public formatAccountForList(account: MattermostAccount): string {
        return account.username + " (Server: " + account.server + ")"
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getAccount(auth: Authentication<MattermostAccount, AccountForm<MattermostAccount>>): MattermostAccount {
        if (auth instanceof MattermostPATAuthentication) {
            const fields = auth.getForm().getFields()
            const serverField = fields.get('server')
            if (!serverField) {
                throw new Error("Missing server field")
            }
            const serverVal = getNodeWidgetValue(serverField.instance)
            const accountId = this.id + '-' + serverVal + '-_token';
            return {
                authentication: 'pat',
                account: accountId,
                username: '_token',
                server: serverVal as string
            }
        } else if (auth instanceof BasicAuthentication) {
            const fields = auth.getForm().getFields()
            const usernameField = fields.get('username')
            if (!usernameField) {
                throw new Error("Missing username field")
            }
            const serverField = fields.get('server')
            if (!serverField) {
                throw new Error("Missing server field")
            }
            const usernameVal = getNodeWidgetValue(usernameField.instance)
            const serverVal = getNodeWidgetValue(serverField.instance)
            const accountId = this.id + '-' + serverVal + '-' + usernameVal;
            return {
                authentication: 'basic',
                account: accountId,
                username: usernameVal as string,
                server: serverVal as string
            }
        }
        return {
            authentication: '',
            account: '',
            username: '',
            server: ''
        };
    }
}
