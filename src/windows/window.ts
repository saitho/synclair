import {QMainWindow} from "@nodegui/nodegui";
import {resolveQIcon} from "../utils";

export abstract class AppWindow extends QMainWindow {
    constructor() {
        super();

        // todo: ico for Windows
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.setWindowIcon(resolveQIcon(require("../../assets/images/appicon.png")))
    }
}
