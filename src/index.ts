import {
  QApplication,
  QMenu,
  QSystemTrayIcon,
  QAction
} from "@nodegui/nodegui";
import EventEmitter from "events";
import {settingsAction} from "./windows/settings";
import {StatusHolder} from "./status";
import {quitAction} from "./actions/quit";
import {getConfigPath, readConfig} from "./config";
import {platforms} from "./services";
import {logger} from "./logger";
import {aboutAction} from "./windows/about";
import notify from "node-notifier";

const em = new EventEmitter();
const config = readConfig()
logger.debug(`Loaded config from "${getConfigPath()}"`)
const statusHolder = new StatusHolder(em, config.settings.statusAfterLaunch, config.settings.updateStatusOnLaunch);

function getMenu(): QMenu {
  const menu = new QMenu()
  const divider = new QAction()
  divider.setSeparator(true)

  for(const action of statusHolder.getStatusActions()) {
    menu.addAction(action)
  }
  menu.addAction(divider);
  menu.addAction(settingsAction);
  menu.addAction(aboutAction);
  menu.addAction(quitAction);
  return menu
}

const tray = new QSystemTrayIcon();
em.on('statusChanged', async (newStatus: number, oldStatus: number) => {
  logger.info('Status changed from ' + oldStatus + ' to ' + newStatus)
  tray.setIcon(statusHolder.getTrayIcon(newStatus));

  // Propagate status to connected platforms
  const promises = [];
  for (const platform of platforms) {
    promises.push(platform.updateStatusAll(newStatus))
  }
  Promise.all(promises)
      .catch((error) => {
        notify.notify({
          title: 'Status update failed',
          message: error.message
        });
      })
});
tray.setContextMenu(getMenu());
tray.setIcon(statusHolder.getTrayIcon());
tray.show();
statusHolder.init();

const qApp = QApplication.instance();
qApp.setQuitOnLastWindowClosed(false); // required so that app doesnt close if we close all windows.

(global as any).systemTray = tray; // To prevent system tray from being garbage collected.
