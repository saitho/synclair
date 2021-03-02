import {QAction, QIcon} from "@nodegui/nodegui";
import EventEmitter from "events";
import {resolveQIcon} from "./utils";

export enum Status {
    ONLINE=0,
    AWAY=1,
    DND=2
}

export const statusMap: Map<number, {icon: string; name: string}> = new Map();
// todo: .ico for Windows
statusMap.set(Status.ONLINE, {name: 'Online', icon: require("../assets/images/status-0.png")})
statusMap.set(Status.AWAY, {name: 'Away', icon: require("../assets/images/status-1.png")})
statusMap.set(Status.DND, {name: 'Do not disturb', icon: require("../assets/images/status-2.png")})

export class StatusHolder {
    protected em: EventEmitter;
    protected currentStatus = 0;
    protected emitInitialChange = false;

    constructor(em: EventEmitter, initialStatus = 0, emitInitialChange = false) {
        this.em = em;
        this.currentStatus = initialStatus;
        this.emitInitialChange = emitInitialChange;
    }

    public init(): void {
        if (this.emitInitialChange) {
            this.em.emit('statusChanged', this.currentStatus, null)
        }
    }

    protected setNewStatus(newStatus: number): void {
        if (this.currentStatus === newStatus) {
            return;
        }
        const oldStatus = this.currentStatus;
        this.currentStatus = newStatus;
        this.em.emit('statusChanged', newStatus, oldStatus)
    }

    public getTrayIcon(status = this.currentStatus): QIcon {
        const statusObj = statusMap.get(status)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return resolveQIcon(statusObj!.icon)
    }

    public getStatusActions(): QAction[] {
        const statusActions = [];
        for (const i in Array.from(statusMap.keys())) {
            const statusNumber = Number(i);
            const status = statusMap.get(statusNumber);
            if (!status) {
                continue
            }
            const action = this.createStatusAction(statusNumber, status.name);
            statusActions.push(action)
        }
        return statusActions;
    }

    protected createStatusAction(id: number, name: string): QAction {
        const action = new QAction();
        action.setProperty('id', id);
        action.setText(name)
        action.addEventListener("triggered", () => {
            this.setNewStatus(id)
        });
        return action;
    }
}
