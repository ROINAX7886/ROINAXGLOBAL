import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// 1. Initialize Cloudinary SDK
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Multer with In-Memory Storage & Strict 2MB Limit
const storage = multer.memoryStorage();

export const uploadAvatar = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max file size
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are permitted.'), false);
        }
    },
});

// 3. Buffer Stream Helper to upload directly into Cloudinary
export const uploadToCloudinary = (buffer, folder = 'roinax_avatars') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

// 4. Helper: Extract public_id with folder prefix from Cloudinary URL
export const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const regex = /\/v\d+\/(.+?)\.[a-zA-Z0-9]+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

// 5. Helper: Destroy asset on Cloudinary
export const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        return await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
        console.warn('Failed to delete old asset from Cloudinary:', error.message);
    }
};

export default cloudinary;