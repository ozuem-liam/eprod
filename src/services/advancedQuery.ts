/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Types } from 'mongoose';
import httpStatus from 'http-status';
import { Request } from '../types/app';
import Logger from '../config/log';
import { Pagination, Populate, Result } from '../types/advancedQuery';
import { formatReqQueryWithRegex } from '../services/format-query';
import ApiError from '../utils/ApiError';

export const buildQuery = (
    req: Request,
    model: Model<any>,
    primaryPopulate?: Populate | string,
    secPopulate?: Populate | string,
    tertiaryPopulate?: Populate | string,
    quartetPopulate?: Populate | string,
): { query: any; queryStr: any } => {
    try {
        let query: any;
        let searchQuery: any;

        // copy req.query
        const reqQuery = { ...req.query };

        // Enumerate fields to exclude from query
        const fieldsToBeRemoved = ['select', 'sort', 'page', 'limit', 'search'];

        // loop over and remove from reqQuery
        fieldsToBeRemoved.forEach((param: string) => delete reqQuery[param]);

        // create query string in order for it to be formatted
        let queryStr: any = JSON.stringify(reqQuery);
        // add operators to queryStr ($gt, $gte, $lt, e.t.c)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex)\b/g, (match: string) => `$${match}`);

        if (req.query.startDate && req.query.endDate) {
            queryStr = queryStr.replace(/startDate/g, 'startDate');
            queryStr = queryStr.replace(/endDate/g, 'endDate');
            queryStr = JSON.stringify({
                // ...JSON.parse(queryStr),
                createdAt: {
                    $gte: new Date(String(req.query.startDate)),
                    $lte: new Date(String(req.query.endDate)),
                },
            });
        }

        // 2023-01-25T10:20:50.013Z
        // 2023-01-23T08:36:19.523Z

        if (req.query.campaign_id) {
            queryStr = queryStr.replace(/campaign_id/g, 'campaign.id');
            queryStr = JSON.stringify({
                ...JSON.parse(queryStr),
                'campaign.id': req.query.campaign_id,
            });
        }

        // queryStr for campaign_status
        if (req.query.campaign_status) {
            queryStr = queryStr.replace(/campaign_status/g, 'campaign.status');
            queryStr = JSON.stringify({
                ...JSON.parse(queryStr),
                'campaign.status': req.query.campaign_status,
            });
        }

        if (req.query.search) {
            searchQuery = {
                $text: {
                    $search: String(req.query.search).split(',').join(' '),
                },
            };

            queryStr = JSON.stringify({
                ...JSON.parse(queryStr),
                ...searchQuery,
            });
        }

        queryStr = formatReqQueryWithRegex(JSON.parse(queryStr));

        console.log('queryStr:', queryStr);

        // Make the query to database
        query = model.find(queryStr);

        // console.log("query: ", query);

        // select fields
        if (req.query && req.query.select) {
            const fields = String(req.query.select).split(',').join(' ');
            query = query.select(fields);
        }

        // sort
        if (req.query && req.query.sort) {
            const sortBy = String(req.query.sort).split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        if (primaryPopulate) {
            query = query.populate(primaryPopulate);
        }

        if (secPopulate) {
            query = query.populate(secPopulate);
        }

        if (tertiaryPopulate) {
            query = query.populate(tertiaryPopulate);
        }

        if (quartetPopulate) {
            query = query.populate(quartetPopulate);
        }

        // executing the built query
        return { query, queryStr };
    } catch (err) {
        Logger.error(err, 'Build query error');
        throw err;
    }
};

export const advancedQuery = async (
    req: Request,
    model: Model<any>,
    primaryPopulate?: Populate | string,
    secPopulate?: Populate | string,
    tertiaryPopulate?: Populate | string,
): Promise<Result> => {
    try {
        // eslint-disable-next-line prefer-const
        let { query, queryStr } = await buildQuery(req, model, primaryPopulate, secPopulate, tertiaryPopulate);
        // pagination

        const page = parseInt(String(req.query?.page), 10) || 1;
        const limit = parseInt(String(req.query?.limit), 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const total = await model.countDocuments(queryStr);

        query = query.skip(startIndex).limit(limit);

        // executing the built query
        const results = await query;

        // console.log('data', results);
        if (results.length === 0) throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'No products!');

        // pagination result
        const pagination: Pagination = {
            total,
        };

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit,
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            };
        }

        return {
            count: results.length,
            pagination,
            results,
        };
    } catch (err) {
        Logger.error(err, 'Advanced query error');
        throw err;
    }
};
