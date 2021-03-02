import {
    ButtonRole, EchoMode,
    QGridLayout,
    QLabel, QLineEdit,
    QMessageBox,
    QPushButton,
    QWidget,
} from "@nodegui/nodegui";
import {BasicAuthentication} from "./basic";
import {
    FormField,
    getNodeWidgetValue,
    isNodeWidgetDefined,
    setNodeWidgetValue
} from "../../nodegui/form-utility";
import {Platform} from "../../platforms/platform";
import {Account} from "../../config";
import {AccountForm} from "../form";

export class BasicForm<T extends Account> extends AccountForm<T> {
    protected authentication: BasicAuthentication<T>;
    protected passwordFieldName = 'password'

    constructor(authentication: BasicAuthentication<T>) {
        super(authentication);
        this.authentication = authentication;
    }

    public getPasswordFieldValue(): string {
        const field = this.getFields().get(this.passwordFieldName)
        if (!field) {
            return ''
        }
        return getNodeWidgetValue(field.instance) as string;
    }

    public getForm(platform: Platform<T>): QWidget {
        const grid = new QGridLayout()
        this.setLayout(grid)

        this.addFormFields(platform, grid, 0)

        const widget = new QWidget()
        widget.setLayout(grid)
        return widget
    }

    public getFields(reset = false): Map<string, FormField> {
        let fields = this.authentication.getFields(reset);

        if (!fields.size) {
            fields = new Map<string, FormField>()
            fields.set('username', {label: 'Username', instance: new QLineEdit()})
            const passwordInput = new QLineEdit()
            passwordInput.setEchoMode(EchoMode.Password)
            fields.set('password', {label: 'Password', instance: passwordInput})
        }

        return fields;
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
            if (errorMessage) {
                this.displayErrorMessage(errorMessage)
                return;
            }

            const newAccount = platform.getAccount(this.authentication)
            if (!errorMessage) {
                const passwordInput = fields.get(this.passwordFieldName)
                if (passwordInput) {
                    const passwordVal = getNodeWidgetValue(passwordInput.instance) as string;
                    this.authentication.validateCredentials(platform, newAccount, passwordVal)
                        .then(() => {
                            this.em.emit('saveAccount', platform.id, newAccount, this.account)
                            this.em.emit('closeWindow')
                        })
                        .catch(() => {
                            errorMessage = 'Unable to validate credentials.\nPlease check whether they are correct.'
                            this.displayErrorMessage(errorMessage)
                        })
                }
            }
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
}
