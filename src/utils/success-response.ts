import { Response } from '../types/app';
import { HttpStatus } from 'http-status';
import Logger from '../config/log';

/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */

export const successResponse = (
    statusCode: number | HttpStatus,
    res: Response,
    message: string,
    data?: any,
    meta?: any,
): Response => {
    const response = {
        code: statusCode,
        message,
        data,
        meta: meta || undefined,
    };

    Logger.response(res.request_id, <number>statusCode, response);

    return res.status(<number>statusCode).json(response);
};
