import {QFrame, Shadow, Shape} from "@nodegui/nodegui";

export class QHorizontalLine extends QFrame {
    constructor(lineHeight = 3, totalHeight = 30) {
        super();
        this.setObjectName('line');
        this.setGeometry(320, 150, 118, lineHeight);
        this.setFrameShape(Shape.HLine);
        this.setFrameShadow(Shadow.Sunken);
        this.setMinimumSize(0, totalHeight)
    }
}
