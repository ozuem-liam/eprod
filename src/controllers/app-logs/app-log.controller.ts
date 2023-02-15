import httpStatus from 'http-status';
import asyncHandler from '../../middlewares/asyncHandler';
import { Request, Response } from '../../types/app';
import { successResponse } from '../../utils/success-response';
import { LogQueryCriteria } from '../../types/log';
import Logger from '../../config/log';

/**
 * @description Get app logs
 * @route GET /xp/logs
 * */
export const getLogs = asyncHandler(async (req: Request, res: Response): Promise<Response | void> => {
    const query = handleQuery(req);

    const result = await Logger.transport.getLogs(query);
    return successResponse(httpStatus.OK, res, 'Logs retrieved', result);
});

const handleQuery = (req: Request): LogQueryCriteria => {
    const query = {} as LogQueryCriteria;
    const limit = 100;

    if (req.query.log_id) query.log_id = String(req.query.log_id);
    if (req.query.app_name) query.app_name = String(req.query.app_name);
    if (req.query.type) query.type = String(req.query.type);
    if (req.query.code) query.code = Number(req.query.code);
    query.limit = req.query.limit ? Number(req.query.limit) : limit;

    return query;
};
