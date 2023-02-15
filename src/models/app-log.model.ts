import { model, Schema } from 'mongoose';
import { IAppLogModel, LogLevels, LogTypes } from '@/types/log';

const appLogSchema = new Schema(
    {
        app_name: {
            type: String,
            required: true,
        },
        log_id: {
            type: String,
            required: true,
        },
        level: {
            type: String,
            enum: Object.values(LogLevels),
        },
        type: {
            type: String,
            enum: Object.keys(LogTypes),
        },
        code: {
            type: String,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        time: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

export const AppLog = model<IAppLogModel>('AppLog', appLogSchema);
