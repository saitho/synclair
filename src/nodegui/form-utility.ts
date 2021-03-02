import {NodeWidget} from "@nodegui/nodegui/dist/lib/QtWidgets/QWidget";
import {QCheckBox, QComboBox, QLineEdit} from "@nodegui/nodegui";

export interface FormField {
    label: string;
    instance: NodeWidget<any>;
    options?: string[];
    optional?: boolean;
    formatFunc?: (value: any) => any;
    validateFunc?: (value: any) => boolean;
}

export function getNodeWidgetValue(input: NodeWidget<any>): string|number|boolean|null {
    if (input instanceof QLineEdit) {
        return (input as QLineEdit).text();
    } else if (input instanceof QComboBox) {
        return (input as QComboBox).currentIndex();
    } else if (input instanceof QCheckBox) {
        return (input as QCheckBox).isChecked();
    }
    return null;
}

export function isNodeWidgetDefined(input: NodeWidget<any>): boolean {
    const value = getNodeWidgetValue(input)
    if (input instanceof QLineEdit) {
        return (value as string).length > 0;
    } else if (input instanceof QComboBox) {
        return true;
    } else if (input instanceof QCheckBox) {
        return value as boolean;
    }
    return false;
}

export function setNodeWidgetValue<T>(input: NodeWidget<any>, value: T): void {
    if (input instanceof QLineEdit) {
        (input as any as QLineEdit).setText(value as any);
    } else if (input instanceof QCheckBox) {
        (input as any as QCheckBox).setChecked(value as any);
    } else if (input instanceof QComboBox) {
        (input as any as QComboBox).setCurrentIndex(value as any);
    }
}
