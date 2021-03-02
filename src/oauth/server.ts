// Start OAuth server on port 4114
import express from 'express';
import EventEmitter from "events";
import {logger} from "../logger";
import {Platform} from "../platforms/platform";
import {OAuthAuthentication} from "../authentications/oauth/oauth";
import {Account} from "../config";

export class OAuthServer<T extends Account> {
    protected server: express.Express;
    protected router = express.Router();
    protected em = new EventEmitter();
    protected platformId: string;
    protected serverStarted = false;

    constructor(platform: Platform<T>, account: T|null) {
        this.server = express()
        this.platformId = platform.id;
        const auth = platform.getAuthentications().filter((a) => a instanceof OAuthAuthentication)[0] as OAuthAuthentication<T>
        if (!auth) {
            return;
        }

        this.router.route('/oauth/' + platform.id + '/start').get(async (req: express.Request, res: express.Response) => {
            res.redirect(await auth.getOauthAuthorizeUrl(account))
        });
        this.router.route('/oauth/' + platform.id + '/verify').get(async (req: express.Request, res: express.Response) => {
            res.send('<script>window.close();</script>Token received. You can close this window now.');
            const token = await auth.getOauthToken(account, req.originalUrl)
            this.em.emit('oauth_granted', token);
        });
        this.server.use(this.router)
    }

    public getEventEmitter(): EventEmitter {
        return this.em;
    }

    public start(): void {
        const startUrl = 'http://localhost:4114/oauth/' + this.platformId + '/start'
        if (this.serverStarted) {
            this.em.emit('started', startUrl);
            return;
        }
        const server = this.server.listen(4114,() => {
            this.serverStarted = true;
            logger.info('OAuth server started')
            this.em.emit('started', startUrl);
            this.em.addListener('stop', () => {
                if (!this.serverStarted) {
                    return;
                }
                server.close();
                logger.info('OAuth server stopped')
                this.serverStarted = false;
            })
        });
    }
}
