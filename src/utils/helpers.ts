/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import { UploadedFile } from 'express-fileupload';
import httpStatus from 'http-status';

import { Request } from '../types/app';
import ApiError from './ApiError';

export const isNotEmpty = (value: string): boolean => value !== undefined && value !== '';

export const checkValidCsv = (req: Request): void => {
    if (!req.files || !req.files.csv) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload a csv file');
    }

    const file = req.files.csv as any;
    if (path.extname(file.name) !== '.csv') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload a csv file');
    }

    const csv = req.files.csv as UploadedFile;
    if (Array.isArray(csv)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload only one (1) csv file');
    }
};
