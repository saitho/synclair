import {Account} from "../../config";
import {JwtForm} from "./form";
import {BasicAuthSettings} from "../basic/basic";
import {Authentication, AuthSettings} from "../authentication";
import {FormField} from "../../nodegui/form-utility";
import {Platform} from "../../platforms/platform";

type JwtAuthSettings<T extends Account> = BasicAuthSettings<T> & AuthSettings<T>

export class JwtAuthentication<T extends Account> extends Authentication<T, JwtForm<T>> {
    protected settings: JwtAuthSettings<T>;
    constructor(settings: JwtAuthSettings<T> = {}) {
        super({
            accountCreationNote: settings.accountCreationNote,
            endpoints: settings.endpoints
        })
        this.form = new JwtForm(this);
        this.settings = settings;
    }

    public validateCredentials(platform: Platform<T>, account: T, password: string): Promise<void> {
        if (this.settings.endpoints?.validateCredentials?.execute) {
            return this.settings.endpoints.validateCredentials.execute(platform, account, password);
        }
        return this.callValidateCredentials(platform, account, password);
    }

    public getPasswordValue(): string {
        return this.getForm().getPasswordFieldValue()
    }

    public newForm(): JwtForm<T> {
        return new JwtForm<T>(this);
    }

    public getFields(): Map<string, FormField> {
        return new Map<string, FormField>()
    }

    get id(): string {
        return 'jwt';
    }

    get name(): string {
        return 'JWT';
    }
}
