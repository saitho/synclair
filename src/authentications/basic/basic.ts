import {
    AuthEndpointValidateCredentials,
    Authentication,
    AuthSettings
} from "../authentication";
import {FormField} from "../../nodegui/form-utility";
import {BasicForm} from "./form";
import {Account} from "../../config";
import {Platform} from "../../platforms/platform";

export interface BasicAuthSettings<T extends Account> {
    fields?: Map<string, FormField>;
    endpoints?: {
        validateCredentials?: AuthEndpointValidateCredentials<T>;
    }
}

export class BasicAuthentication<T extends Account> extends Authentication<T, BasicForm<T>> {
    protected settings: BasicAuthSettings<T> & AuthSettings<T>;

    constructor(settings: BasicAuthSettings<T> & AuthSettings<T>) {
        super(settings)
        this.settings = settings
    }

    public validateCredentials(platform: Platform<T>, account: T, password: string): Promise<void> {
        if (this.settings.endpoints?.validateCredentials?.execute) {
            return this.settings.endpoints.validateCredentials.execute(platform, account, password);
        }
        return this.callValidateCredentials(platform, account, password);
    }

    public newForm(): BasicForm<T> {
        return new BasicForm<T>(this);
    }

    public getPasswordValue(): string {
        return this.getForm().getPasswordFieldValue()
    }

    public getFields(reset = false): Map<string, FormField> {
        if (reset) {
            const map = new Map<string, FormField>()
            if (!this.settings.fields) {
                return map
            }
            this.settings.fields.forEach((value, key) => {
                map.set(key, {...value, instance: Object.assign(Object.create(Object.getPrototypeOf(value.instance)), value.instance)})
            })
            this.settings.fields = map;
        }

        return this.settings.fields || new Map<string, FormField>();
    }

    get id(): string {
        return 'basic';
    }

    get name(): string {
        return 'Username/Password';
    }
}
