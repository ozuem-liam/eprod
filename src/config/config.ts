import dotenv from 'dotenv';
import fs from 'fs';
import { Config, AppEnv } from '../types/config';

export const appPrefix = '/api/v3';
(function loadEnv() {
    const envPath = '.env';
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync('.env'));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
})();

export const getConfig = (): Config => {
    const required: string[] = [
        'APP_ENV',
        'APP_PORT',
        'DB_URI',
    ];

    required.forEach((variable: string) => {
        if (!process.env[variable]) throw new Error(`${variable} env not set`);
    });

    return {
        appEnv: (process.env.APP_ENV as AppEnv) || AppEnv.DEVELOPMENT,
        environment: process.env.APP_ENV || AppEnv.DEVELOPMENT,
        isProduction: process.env.APP_ENV === AppEnv.PRODUCTION,
        isTest: process.env.APP_ENV === AppEnv.TEST,
        appPort: Number(process.env.APP_PORT) || 9000,
        appPrefixPath: process.env.APP_PREFIX_PATH || appPrefix,
        dbUri: process.env.DB_URI,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    };
};

export default getConfig();