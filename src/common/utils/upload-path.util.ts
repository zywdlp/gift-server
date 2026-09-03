import { resolve } from "path";

/** 商品图片的本地存储根目录。 */
export const getUploadRoot = () => resolve(process.env.UPLOAD_DIR || "uploads");

/** 对外暴露的上传文件 URL 前缀。 */
export const UPLOAD_URL_PREFIX = "/uploads";
