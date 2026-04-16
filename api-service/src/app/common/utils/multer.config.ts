// multer.config.ts

import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// Ensure folder exists
const uploadPath = process.cwd() + '/uploads';

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

export const multerStorage = diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

        const fileExt = extname(file.originalname);

        cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
    },
});

import { Request } from 'express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: any,
) => {
    const allowedTypes = /jpg|jpeg|png|webp/;

    const isValid =
        allowedTypes.test(file.mimetype) &&
        allowedTypes.test(extname(file.originalname).toLowerCase());

    if (isValid) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

export const multerOptions: MulterOptions = {
    storage: multerStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
};