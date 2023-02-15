import fs from 'fs';
import { UploadedFile } from 'express-fileupload';
import { uploadLocalFile } from './cloudinary';
import Logger from '../config/log';
import { ALPHANUMERIC_POOL, generateString } from './generateString';

const imageUploader = async (path: string): Promise<string> => {
    // upload image
    const { url } = await uploadLocalFile(path);
    // remove image from server
    fs.unlinkSync(path);
    return url;
};

const getPath = async (file: UploadedFile | UploadedFile[]): Promise<string> => {
    let filePath: string;
    if ('name' in file) {
        filePath = `${__dirname}/${generateString(ALPHANUMERIC_POOL, 16)}-${file.name}`;
        await file.mv(filePath);
    }
    return filePath;
};

export const uploadImage = async (file: UploadedFile | UploadedFile[]): Promise<string> => {
    try {
        const filePath = await getPath(file);
        return imageUploader(filePath);
    } catch (err) {
        Logger.error(err, 'Image uploader error');
        throw new Error(err);
    }
};

export const uploadImages = async (files: UploadedFile[]): Promise<string[]> => {
    try {
        const paths = [];
        const images = [];

        for (const file of files) {
            const path = await getPath(file);
            paths.push(path);
        }

        for (const path of paths) {
            const image = await imageUploader(path);
            images.push(image);
        }

        return images;
    } catch (err) {
        Logger.error(err, 'Image multiple uploader error');
        throw new Error(err);
    }
};
