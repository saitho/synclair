import {BasicAuthentication} from "../../authentications/basic/basic";
import {MattermostAccount} from "../mattermost";
import {Client4} from "mattermost-redux/client";
import {logger} from "../../logger";
import {UserStatus} from "mattermost-redux/types/users";
import {getPassword} from "keytar";
import axios from "axios";
import {Status} from "../../status";
import {Platform} from "../platform";
import fetch from 'node-fetch';

// Make fetch work with NodeJS
if (!globalThis.fetch) {
    (globalThis as any).fetch = fetch;
}

export class MattermostBasicAuthentication extends BasicAuthentication<MattermostAccount> {
    protected callValidateCredentials(platform: Platform<MattermostAccount>, account: MattermostAccount, password: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Client4.setUrl(account.server)
            Client4.login(account.username, password)
                .then(() => {
                    logger.info(`Validated Mattermost account "${account.username}"`)
                    resolve()
                })
                .catch((error: Error) => {
                    logger.error(`Unable to validate Mattermost account (ID: ${account.account}): ${error}"`)
                    reject(error)
                })
        })
    }

    protected updateMattermostStatus(token: string, status: UserStatus, account: MattermostAccount): Promise<UserStatus> {
        Client4.setToken(token)
        Client4.setUrl(account.server)
        const update = Client4.updateStatus(status)
        update.then(() => {
            logger.info(`Updated status for Mattermost account "${account.username}" on server "${account.server}"`)
        }).catch((error) => {
            logger.error(error.message)
            error.message = '[Mattermost] ' + error.message
        })
        return update
    }

    protected callUpdateStatus(platform: Platform<MattermostAccount>, account: MattermostAccount, statusId: Status): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const status: UserStatus = {
                user_id: 'me',
                status: 'online',
                last_activity_at: 0,
                manual: true
            }
            if (statusId == 1) {
                status.status = 'away'
            } else if (statusId == 2) {
                status.status = 'dnd'
            }

            // Get Mattermost password
            getPassword(account.account, account.username)
                .then((password) => {
                    // Get Mattermost token
                    axios.post(
                        account.server + '/api/v4/users/login',
                        {login_id: account.username, password: password}
                    )
                        .then((r) => {
                            status.user_id = r.data.id
                            this.updateMattermostStatus(r.headers.token, status, account)
                                .then(() => resolve())
                                .catch(reject)
                        })
                        .catch((error) => {
                            logger.error(`Unable to connect to Mattermost account "${account.username}" on server "${account.server}: ${error}"`)
                            error.message = '[Mattermost] ' + error.message
                            reject(error)
                        });
                })
                .catch((error: Error) => {
                    logger.error(`Unable to fetch password for Mattermost account (ID: ${account.account}): ${error}"`)
                    reject(error)
                });
        })
    }
}
