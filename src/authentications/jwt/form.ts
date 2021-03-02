import {Account} from "../../config";
import {
    ButtonRole,
    EchoMode,
    QGridLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QWidget
} from "@nodegui/nodegui";
import {FormField, getNodeWidgetValue, isNodeWidgetDefined, setNodeWidgetValue} from "../../nodegui/form-utility";
import {JwtAuthentication} from "./jwt";
import {logger} from "../../logger";
import {AccountForm} from "../form";
import {Platform} from "../../platforms/platform";

export class JwtForm<T extends Account> extends AccountForm<T> {
    protected authentication: JwtAuthentication<T>;
    protected fields = new Map<string, FormField>();
    protected passwordFieldName = 'password';

    constructor(authentication: JwtAuthentication<T>) {
        super(authentication);
        this.authentication = authentication;
    }

    public getForm(platform: Platform<T>): QWidget {
        const grid = new QGridLayout()
        this.setLayout(grid)

        this.addFormFields(platform, grid, 0)

        const widget = new QWidget()
        widget.setLayout(grid)
        return widget
    }

    public getPasswordFieldValue(): string {
        const field = this.getFields().get(this.passwordFieldName)
        if (!field) {
            return ''
        }
        return getNodeWidgetValue(field.instance) as string;
    }

    protected addFormFields(platform: Platform<T>, grid: QGridLayout, rowCounter = 0): void {
        const fields = this.getFields(true)

        fields.forEach((field, fieldName) => {
            const label = new QLabel()
            label.setText(field.label)
            if (this.account && Object.prototype.hasOwnProperty.call(this.account, fieldName) && this.account.authentication === this.authentication.id) {
                setNodeWidgetValue(field.instance, (this.account as any)[fieldName])
            }
            grid.addWidget(label, rowCounter, 0)
            grid.addWidget(field.instance, rowCounter, 1)
            rowCounter++;
        })

        const saveButton = new QPushButton()
        saveButton.setText("Validate credentials and save")
        saveButton.addEventListener('clicked', async () => {
            const requiredFields: FormField[] = []
            fields.forEach((field, name) => {
                if (field.optional) {
                    return
                }
                requiredFields.push(field)
            })

            let errorMessage;
            for (const field of requiredFields) {
                const instance = field.instance
                if (!isNodeWidgetDefined(instance)) {
                    errorMessage = 'The field "' + field.label + '" is required!'
                    break;
                }
                let value = getNodeWidgetValue(instance)

                value = field.formatFunc?(value) : value
                const validateResult = field.validateFunc?(value) : true
                if (!validateResult) {
                    errorMessage = 'The value of field "' + field.label + '" is invalid!'
                    break;
                }
            }

            const newAccount = platform.getAccount(this.authentication)
            if (!errorMessage) {
                const passwordInput = fields.get(this.passwordFieldName)
                if (passwordInput) {
                    const passwordVal = getNodeWidgetValue(passwordInput.instance) as string;
                    if (await this.authentication.validateCredentials(platform, newAccount, passwordVal) === null) {
                        errorMessage = 'Unable to validate credentials. Please check whether they are correct.'
                    }
                }
            }

            if (errorMessage) {
                const messageBox = new QMessageBox();
                messageBox.setText(errorMessage);
                messageBox.setWindowTitle('Oops, an error occurred!')
                const accept = new QPushButton();
                accept.setText('OK');
                messageBox.addButton(accept, ButtonRole.AcceptRole);
                messageBox.exec()
                return;
            }

            this.em.emit('saveAccount', platform.id, newAccount, this.account)
            this.em.emit('closeWindow')
        })
        grid.addWidget(saveButton, rowCounter, 0, 1, 0)
        rowCounter++;

        this.addStatelessFormButtons(rowCounter, grid)
    }

    protected addStatelessFormButtons(row: number, grid: QGridLayout): number {
        const closeButton = new QPushButton()
        closeButton.setText('Abort and close')
        closeButton.addEventListener('clicked', () => this.em.emit('closeWindow'))
        grid.addWidget(closeButton, row, 0, 1, 0)
        row++
        return row;
    }

    public getFields(reset = false): Map<string, FormField> {
        if (this.fields.size && !reset) {
            logger.debug('Returning already set fields.')
            return this.fields
        }
        let fields = this.authentication.getFields();
        if (!fields.size) {
            logger.debug('Setting default fields.')
            fields = new Map<string, FormField>()
            fields.set('username', {label: 'JWT API Key', instance: new QLineEdit()})
            const passwordInput = new QLineEdit()
            passwordInput.setEchoMode(EchoMode.Password)
            fields.set('password', {label: 'JWT API Secret', instance: passwordInput})
        }
        this.fields = fields

        return this.fields;
    }
}
