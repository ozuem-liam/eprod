import express from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import fileupload from 'express-fileupload';
import routes from './routes';
import { morganSuccessHandler, morganErrorHandler } from './config/morgan';
import Config from './config/config';
import httpStatus from 'http-status';
import ApiError from './utils/ApiError';
import { errorConverter, errorHandler } from './middlewares/error';
import { logRequestMiddleware } from './config/log';
const { isTest, appPrefixPath } = Config;

const app = express();

if (!isTest) {
    app.use(morganSuccessHandler);
    app.use(morganErrorHandler);
}

// file upload
app.use(
    fileupload({
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    }),
);

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// Prevent http param pollution
app.use(hpp());

// gzip compression
app.use(compression());

app.use(cors());

// log middleware
app.use(logRequestMiddleware());

app.get('/', (_req, res) => {
    res.send('Healthy');
});

app.use(appPrefixPath, routes);

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
