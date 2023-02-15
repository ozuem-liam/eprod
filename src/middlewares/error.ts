import { Request, Response, NextFunction } from '../types/app';
import ApiError from '../utils/ApiError';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import Config from '../config/config';
import Logger from '../config/log';

const { isProduction, isTest } = Config;

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction): void => {
    let error = err;

    // mongoose bad object id
    if (err.name === 'CastError') {
        error = new ApiError(httpStatus.NOT_FOUND, 'Resource not found', err.stack);
    } else if (err.code === 11000) {
        //mongooose duplicate key
        error = new ApiError(httpStatus.BAD_REQUEST, 'Duplicate field value entered', err.stack);
    } else if (err.name === 'ValidationError') {
        // mongoose validation error
        const messages = Object.values(err.errors)
            .map((val: Record<string, string>) => val.message)
            .join();
        error = new ApiError(httpStatus.BAD_REQUEST, messages, err.stack);
    } else if (err instanceof ApiError) {
        error = err;
    } else if (typeof err === 'string') {
        error = new ApiError(httpStatus.BAD_REQUEST, err);
    } else {
        const statusCode =
            error.statusCode || error instanceof mongoose.Error
                ? httpStatus.BAD_REQUEST
                : httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[statusCode];
        error = new ApiError(statusCode, message as string, err.stack);
    }

    next(error);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction): Response => {
    let { statusCode, message } = err;

    if (err.name === 'MongoError') return res.status(httpStatus.BAD_REQUEST).send(err);

    if (isProduction && !err.isOperational) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = <string>httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }

    res.locals.errorMessage = err.message;

    const response = {
        code: statusCode,
        message,
        ...(!isProduction && { stack: err.stack }),
    };

    if (!isTest) {
        Logger.error(err);
    }

    Logger.response(res.request_id, <number>statusCode, { ...response, stack: err.stack });

    res.status(statusCode).json(response);
};
