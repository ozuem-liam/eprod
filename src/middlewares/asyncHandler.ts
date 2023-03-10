import { Request, Response, NextFunction } from '../types/app';

const asyncHandler =
    (fn: (req: Request, res: Response, next?: NextFunction) => void) =>
    (req: Request, res: Response, next: NextFunction): Response | void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export default asyncHandler;