import { v2 as cloudinary } from "cloudinary";
import { getConfig } from "../config/config";

const { cloud_name, api_key, api_secret } = getConfig();

cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
});

export const uploadLocalFile = async (filePath: string) => {
  let url: string;
  const file = await cloudinary.uploader.upload(filePath);
  if (file) {
    url = file.url;
  }
  return {url};
};
