const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 25_000_000;
const IMAGE_FORMATS = {
  jpeg: { mime: 'image/jpeg', extensions: new Set(['.jpg', '.jpeg']), extension: '.jpg' },
  png: { mime: 'image/png', extensions: new Set(['.png']), extension: '.png' },
};

async function sanitizeImageBuffer(buffer, file) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const expectedFormat = Object.entries(IMAGE_FORMATS).find(([, config]) =>
    config.extensions.has(extension)
  );

  if (!expectedFormat || file.mimetype !== expectedFormat[1].mime) {
    const error = new Error('File harus berupa JPEG atau PNG yang formatnya sesuai dengan isi file.');
    error.status = 415;
    throw error;
  }

  try {
    const image = sharp(buffer, {
      failOn: 'error',
      limitInputPixels: MAX_INPUT_PIXELS,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      metadata.format !== expectedFormat[0] ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_INPUT_PIXELS
    ) {
      const error = new Error('Isi file tidak sesuai dengan gambar JPEG atau PNG yang valid.');
      error.status = 415;
      throw error;
    }

    const sanitized = expectedFormat[0] === 'jpeg'
      ? await image.rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer()
      : await image.rotate().png({ compressionLevel: 9 }).toBuffer();

    return {
      buffer: sanitized,
      format: expectedFormat[0],
      extension: expectedFormat[1].extension,
      mimetype: expectedFormat[1].mime,
    };
  } catch (error) {
    if (error.status) throw error;
    const invalidImage = new Error('Isi file bukan gambar JPEG atau PNG yang valid.');
    invalidImage.status = 415;
    throw invalidImage;
  }
}

function secureImageUpload(destination, { maxFileSize = MAX_FILE_SIZE } = {}) {
  const absoluteDestination = path.resolve(destination);
  const receiveImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize, files: 1 },
  });

  return {
    single(fieldName) {
      return (req, res, next) => {
        receiveImage.single(fieldName)(req, res, async (receiveError) => {
          if (receiveError) return next(receiveError);
          if (!req.file) return next();

          let image;
          try {
            image = await sanitizeImageBuffer(req.file.buffer, req.file);
            if (image.buffer.length > maxFileSize * 2) {
              const error = new Error('Ukuran gambar setelah diproses terlalu besar.');
              error.status = 413;
              throw error;
            }

            try {
              await fs.promises.access(absoluteDestination, fs.constants.W_OK);
            } catch (storageError) {
              const error = new Error(
                'Folder upload belum tersedia atau tidak dapat ditulisi. Siapkan foldernya terlebih dahulu atau gunakan penyimpanan file online.'
              );
              error.status = 503;
              error.cause = storageError;
              throw error;
            }

            const filename = `${crypto.randomUUID()}${image.extension}`;
            const filePath = path.join(absoluteDestination, filename);
            await fs.promises.writeFile(filePath, image.buffer, { flag: 'wx' });

            Object.assign(req.file, {
              buffer: image.buffer,
              destination: absoluteDestination,
              filename,
              path: filePath,
              mimetype: image.mimetype,
              size: image.buffer.length,
            });
            next();
          } catch (error) {
            next(error);
          }
        });
      };
    },
  };
}

module.exports = { sanitizeImageBuffer, secureImageUpload };
