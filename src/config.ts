import path from "path";
import * as os from "os";
import YAML from 'yaml'
import * as fs from "fs";

export function getAppConfigDir(): string {
    return path.resolve(os.homedir(), '.config', 'status-updater');
}

export function getConfigPath(): string {
    return path.resolve(getAppConfigDir(), 'config.yml')
}

export type AuthenticationType = ""|"basic"|"oauth2"|"jwt"|"pat"

export interface Account {
    authentication: AuthenticationType;
    account: string;
    username: string;
}

export interface OAuthAccount extends Account {
    oAuthClientId?: string;
}

export interface Config {
    settings: {
        launchOnStartup: boolean
        statusAfterLaunch: number
        updateStatusOnLaunch: boolean
    }
    services?: {
        [name: string]: null|Account|Account[];
    }
}

export function readConfig(): Config {
    const configPath = getConfigPath()
    if (!fs.existsSync(configPath)) {
        // File does not exist, create default configuration
        const config: Config = {
            settings: {
                launchOnStartup: false,
                statusAfterLaunch: 0, // online
                updateStatusOnLaunch: false
            }
        }
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, YAML.stringify(config), 'utf8')
        return config;
    }

    const file = fs.readFileSync(configPath, 'utf8')
    return YAML.parse(file) as Config
}
