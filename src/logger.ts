import winston from "winston";
import * as fs from "fs";
import path from "path";
import {getAppConfigDir} from "./config";

const logDir = path.resolve(getAppConfigDir(), 'logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, {recursive: true})
}

export const logger: winston.Logger = winston.createLogger({
    transports: [
        new winston.transports.Console({ level: 'debug' }),
        new winston.transports.File({ filename: logDir + '/combined.log', level: 'warning' }),
        new winston.transports.File({ filename: logDir + '/error.log', level: 'error' })
    ]
});
