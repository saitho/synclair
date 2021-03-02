import {QAction, QApplication} from "@nodegui/nodegui";

export const quitAction = new QAction();
quitAction.setText("Quit");
quitAction.addEventListener("triggered", () => {
    const app = QApplication.instance();
    app.exit(0);
});
