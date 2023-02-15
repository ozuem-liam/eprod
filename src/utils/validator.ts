/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectSchema } from 'joi';

const validateSchema = (
    schema: ObjectSchema,
    body: Record<string, unknown>,
    opts: any = {},
): {
    error?: string;
    value?: any;
} => {
    const { error, value } = schema.validate(body, {
        abortEarly: false,
        allowUnknown: opts.allowUnknown || false,
    });

    if (error) {
        let [
            {
                message: errorMessage,
                // eslint-disable-next-line prefer-const
                type: errorType,
                // eslint-disable-next-line prefer-const
                context: { key },
            },
        ] = error.details;
        if (errorType === 'any.required') errorMessage = `${key} is required`;
        if (errorType === 'object.unknown') {
            errorMessage = `Unknown/Unexpected parameter: '${error.details[0].context.key}'`;
        }

        return { error: errorMessage };
    }

    return { value };
};

export default validateSchema;
