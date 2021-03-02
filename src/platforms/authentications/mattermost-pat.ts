import {MattermostAccount} from "../mattermost";
import {Client4} from "mattermost-redux/client";
import {logger} from "../../logger";
import {UserProfile, UserStatus} from "mattermost-redux/types/users";
import {getPassword} from "keytar";
import {Status} from "../../status";
import {Platform} from "../platform";
import fetch from 'node-fetch';
import {MattermostBasicAuthentication} from "./mattermost-basic";

// Make fetch work with NodeJS
if (!globalThis.fetch) {
    (globalThis as any).fetch = fetch;
}

export class MattermostPATAuthentication extends MattermostBasicAuthentication {
    get id(): string {
        return 'pat';
    }

    get name(): string {
        return 'Personal Access Token (PAT)';
    }

    protected getCurrentUserDetails(account: MattermostAccount, token: string): Promise<UserProfile> {
        Client4.setUrl(account.server)
        Client4.setToken(token)
        return Client4.getUser('me')
    }

    protected callValidateCredentials(platform: Platform<MattermostAccount>, account: MattermostAccount, password: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getCurrentUserDetails(account, password)
                .then(() => {
                    logger.info(`Validated Mattermost account "${account.username}"`)
                    resolve()
                })
                .catch((error: Error) => {
                    logger.error(`Unable to validate Mattermost account (ID: ${account.account}) via PAT: ${error}"`)
                    reject(error)
                })
        })
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
                    this.getCurrentUserDetails(account, password as string)
                        .then((profile) => {
                            status.user_id = profile.id
                            this.updateMattermostStatus(password as string, status, account)
                                .then(() => resolve())
                                .catch(reject)
                        })
                        .catch((error: Error) => {
                            logger.error(`Unable to fetch user details for Mattermost account (ID: ${account.account}): ${error}"`)
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
