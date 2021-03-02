import {
    Direction,
    MatchFlag,
    QBoxLayout,
    QGridLayout,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QPushButton,
    QVariant,
    QWidget,
    WidgetAttribute,
    WidgetEventTypes
} from "@nodegui/nodegui";
import {SelectionBehavior, SelectionMode} from "@nodegui/nodegui/dist/lib/QtWidgets/QAbstractItemView";
import {Account} from "../config";
import {PlatformSettingsWindow} from "./settings-platform";
import {YamlConfigWriter} from "../nodegui/yaml-config-writer";
import {MultiAccountPlatform} from "../platforms/platform-multiAccount";
import {AccountWindow} from "./account";

export class MultiAccountPlatformSettingsWindow<T extends Account> extends PlatformSettingsWindow<MultiAccountPlatform<any>> {
    protected dataList: QListWidget = new QListWidget()

    protected accountWindow: AccountWindow<T>;

    constructor(platform: MultiAccountPlatform<T>, configManager: YamlConfigWriter<any>) {
        super(platform, configManager);
        this.accountWindow = new AccountWindow();
        (global as any).accountWindow = this.accountWindow;

        this.dataList.setObjectName('accountListing')
        this.dataList.setSelectionMode(SelectionMode.SingleSelection)
        this.dataList.setSelectionBehavior(SelectionBehavior.SelectRows)

        this.renderAccountListStructure()
        this.populateData()
    }

    protected renderAccountListStructure(): void {
        const rootView = new QWidget();
        this.setCentralWidget(rootView);
        const grid = new QGridLayout()
        rootView.setLayout(grid)

        const label = new QLabel();
        label.setText("Connected " + this.platform.name + " accounts")
        grid.addWidget(label, 0, 0)

        grid.addWidget(this.dataList, 1, 0)

        const editArea = new QWidget();
        const buttons = new QBoxLayout(Direction.TopToBottom)
        editArea.setLayout(buttons)

        const btnAdd = new QPushButton()
        btnAdd.setText("Add")
        btnAdd.addEventListener('clicked', () => {
            this.accountWindow.initialize(this.platform);
            this.accountWindow.getEventEmitter().on('accountAdded', (provider: string, newAccount: Account) => {
                this.insertData(newAccount);
            });
            this.accountWindow.show();
        })
        buttons.addWidget(btnAdd)

        const btnEdit = new QPushButton();
        btnEdit.setText("Edit")
        btnEdit.setEnabled(this.dataList.count() > 0)
        btnEdit.addEventListener('clicked', () => {
            const selectedItem = this.dataList.currentItem()
            const UserRole = 0x0100
            const accountId = selectedItem.data(UserRole).toString();

            this.accountWindow.initialize(this.platform, {accountToEdit: this.accountRepository.find(accountId)});
            this.accountWindow.getEventEmitter().on('accountUpdated', (provider, newAccount: Account, oldAccount: Account) => {
                this.dataList.findItems(this.platform.formatAccountForList(oldAccount), MatchFlag.MatchExactly)[0]
                    .setText(this.platform.formatAccountForList(newAccount));
            })
            this.accountWindow.show()
        })
        buttons.addWidget(btnEdit)

        const btnDelete = new QPushButton();
        btnDelete.setText("Delete")
        btnDelete.setEnabled(this.dataList.count() > 0)
        btnDelete.addEventListener('clicked', async () => {
            const selectedItem = this.dataList.currentItem()
            const UserRole = 0x0100
            const accountId = selectedItem.data(UserRole).toString()
            const accountRepo = this.platform.getAccountRepository(this.configManager)
            const account = accountRepo.find(accountId)
            if (!account) {
                return;
            }
            if (await accountRepo.delete(account)) {
                this.dataList.takeItem(this.dataList.currentRow())
            }
            this.em.emit('refreshButtonStates');
        })
        buttons.addWidget(btnDelete)

        this.dataList.addEventListener('currentItemChanged', () => this.em.emit('refreshButtonStates'))
        this.em.on('refreshButtonStates', () => {
            btnEdit.setEnabled(this.dataList.count() > 0)
            btnDelete.setEnabled(this.dataList.count() > 0)
        })

        grid.addWidget(editArea, 0, 1, 0, 1)
    }

    protected populateData(): void {
        if (!this.config?.services) {
            return;
        }
        for (const account of (this.config?.services[this.platform.id] as Account[])) {
            this.insertData(account);
        }
    }

    protected insertData(account: Account): void {
        const item = new QListWidgetItem()
        item.setText(this.platform.formatAccountForList(account))
        const UserRole = 0x0100
        item.setData(UserRole, new QVariant(account.account))
        this.dataList.addItem(item)
    }
}
