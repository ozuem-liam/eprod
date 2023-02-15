import { Document } from 'mongoose';

export enum LogLevels {
    fatal = 'fatal',
    error = 'error',
    warn = 'warn',
    info = 'info',
    debug = 'debug',
    trace = 'trace',
    silent = 'silent',
}

export type LogLevelsNumbers = '10' | '20' | '30' | '40' | '50' | '60';

export enum LogTypes {
    request = 'request',
    response = 'response',
    fatal = 'error',
    error = 'error',
    info = 'info',
    debug = 'debug',
}

export type UnknownObject = Record<string, unknown>;

export type Log = {
    level: LogLevels;
    type: LogTypes;
    data: UnknownObject | Error;
    code?: number;
    id?: string;
    message?: string;
};

export type LogWriteObject = {
    level: LogLevels;
    time: number;
    pid: number;
    hostname: string;
    name: string;
    message?: string;
    code?: number;
    id: string;
    type: LogTypes;
    msg?: string;
};

export type LogQueryCriteria = {
    log_id: string;
    app_name: string;
    code: number;
    type: string;
    limit: number;
};

export type LogTransportFunction = (logObject: LogWriteObject, log: string) => void;

export interface LogTransport {
    write: (log: string) => void;
    getLogs: (criteria: LogQueryCriteria) => Promise<Log[]>;
}

export interface IAppLog {
    level: string;
    type: LogTypes;
    app_name: string;
    log_id: string;
    code: string;
    message: string;
    data: UnknownObject;
    time: string;
}

export interface IAppLogModel extends Document, IAppLog {}
