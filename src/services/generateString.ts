import { customAlphabet } from 'nanoid';

export const ALPHANUMERIC_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
export const NUMBER_POOL = '1234567890';
export const ALPHABET_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const generateString = (pool: string = ALPHABET_POOL, size = 7): string => {
    const nanoid = customAlphabet(pool, size);

    return nanoid();
};
