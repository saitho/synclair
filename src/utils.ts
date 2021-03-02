import path from "path";
import {QIcon} from "@nodegui/nodegui";

export function resolveQIcon(iconPath: string): QIcon {
   return new QIcon(path.resolve(__dirname, iconPath))
}
