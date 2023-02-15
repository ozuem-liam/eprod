import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { IAdminDocument } from './admin';

export interface Request extends ExpressRequest {
    request_id: string;
    user: IAdminDocument;
}

export interface Response extends ExpressResponse {
    request_id: string;
}

export { NextFunction, Router } from 'express';