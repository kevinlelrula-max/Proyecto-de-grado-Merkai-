import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const subirImagen = (buffer, folder, publicId) =>
  new Promise((resolve, reject) => {
    const opts = { folder, resource_type: "image" };
    if (publicId) opts.public_id = publicId;
    cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    }).end(buffer);
  });

export default cloudinary;
