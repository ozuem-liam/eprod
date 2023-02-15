import mongoose from 'mongoose';
import app from './app';
import Config from './config/config';
import Logger from './config/log';

const { dbUri, appPort } = Config;

Logger.info({}, 'connecting to database...');

mongoose
    .connect(dbUri, { autoIndex: false })
    .then(() => {
        Logger.info({}, 'Mongoose connection done');
        app.listen(appPort, () => {
            Logger.info({}, `server listening on ${appPort}`);
        }); 
    })
    .catch((e) => {
        Logger.info({}, 'Mongoose connection error');
        Logger.error(e);
        process.exit(1);
    });

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
    Logger.info({}, 'Mongoose default connection open to ' + dbUri);
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
    Logger.error(err, 'Mongoose default connection error');
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
    Logger.info({}, 'Mongoose default connection disconnected');
});

async function graceful() {
    process.exit(0);
}

process.on('SIGTERM', graceful);

// If the Node process ends, close the Mongoose connection (ctrl + c)
process.on('SIGINT', () => {
    graceful().then(() => Logger.error(new Error('Closing job schedulers')));
    mongoose.connection.close(() => {
        Logger.info({}, 'Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    Logger.error(err, 'Uncaught Exception');
});
