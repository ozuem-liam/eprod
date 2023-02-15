import morgan from 'morgan';
import Config from './config';
import Logger from './log';

const { isProduction } = Config;

// morgan.token('message', (req, res) => res.locals.errorMessage || '');

const getIpFormat = () => (isProduction ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
// const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;

export const morganSuccessHandler = morgan(successResponseFormat, {
    skip: (req, res) => res.statusCode >= 400,
    stream: { write: (message) => Logger.info({}, message.trim()) },
});

export const morganErrorHandler = morgan(errorResponseFormat, {
    skip: (req, res) => res.statusCode < 400,
    stream: { write: (message) => Logger.error(new Error(message.trim())) },
});
