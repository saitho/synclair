import {
    AlignmentFlag,
    QAction,
    QGridLayout,
    QLabel,
    QWidget,
    TextFormat
} from "@nodegui/nodegui";
import versions from "../_versions";
import {AppWindow} from "./window";

class AboutWindow extends AppWindow {
    constructor() {
        super();

        this.setWindowTitle('About')
        this.setMinimumSize(300, 200)

        const rootView = new QWidget();
        this.setCentralWidget(rootView);
        const grid = new QGridLayout()
        rootView.setLayout(grid)

        const text = new QLabel();
        text.setText(`status-updater<br/>Version: <i>${versions.version} (${versions.gitCommitHash})</i>`);
        text.setTextFormat(TextFormat.RichText)
        text.setAlignment(AlignmentFlag.AlignCenter)
        grid.addWidget(text);

        // const button = new QPushButton()
        // button.setText('GitHub')
        // // eslint-disable-next-line @typescript-eslint/no-var-requires
        // button.setIcon(resolveQIcon(require('../../assets/images/github-logo.png')))
        // grid.addWidget(button, 1)

        const text2 = new QLabel();
        text2.setText(`Copyright © 2021 by Mario Lubenka`)
        text2.setAlignment(AlignmentFlag.AlignCenter)
        grid.addWidget(text2, 2);
    }
}

const win = new AboutWindow();
(global as any).aboutWin = win; // To prevent win from being garbage collected.

export const aboutAction = new QAction();
aboutAction.setText("About...");
aboutAction.addEventListener("triggered", () => {
    win.show()
    win.center()
});
