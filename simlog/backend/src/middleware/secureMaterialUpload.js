const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const FILE_TYPES = {
  '.pdf': {
    mimeTypes: ['application/pdf'],
    signature: (buffer) => buffer.subarray(0, 5).toString() === '%PDF-',
  },
  '.doc': {
    mimeTypes: ['application/msword'],
    signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from('D0CF11E0A1B11AE1', 'hex')),
  },
  '.xls': {
    mimeTypes: ['application/vnd.ms-excel'],
    signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from('D0CF11E0A1B11AE1', 'hex')),
  },
  '.ppt': {
    mimeTypes: ['application/vnd.ms-powerpoint'],
    signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from('D0CF11E0A1B11AE1', 'hex')),
  },
  '.docx': {
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    signature: (buffer) => buffer.subarray(0, 2).toString() === 'PK',
  },
  '.xlsx': {
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    signature: (buffer) => buffer.subarray(0, 2).toString() === 'PK',
  },
  '.pptx': {
    mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    signature: (buffer) => buffer.subarray(0, 2).toString() === 'PK',
  },
  '.txt': {
    mimeTypes: ['text/plain'],
    signature: () => true,
  },
};

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function secureMaterialUpload(destination) {
  const absoluteDestination = path.resolve(destination);
  const receiveFile = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  });

  return {
    single(fieldName) {
      return (req, res, next) => {
        receiveFile.single(fieldName)(req, res, async (receiveError) => {
          if (receiveError) return next(receiveError);
          if (!req.file) return next();

          try {
            const extension = path.extname(req.file.originalname || '').toLowerCase();
            const config = FILE_TYPES[extension];
            if (!config || !config.mimeTypes.includes(req.file.mimetype)) {
              throw httpError(415, 'Format file materi harus PDF, Word, Excel, PowerPoint, atau TXT.');
            }
            if (!config.signature(req.file.buffer)) {
              throw httpError(415, 'Isi file tidak cocok dengan format dokumen yang dipilih.');
            }

            try {
              await fs.promises.access(absoluteDestination, fs.constants.W_OK);
            } catch (storageError) {
              const error = httpError(
                503,
                'Folder unggahan materi belum tersedia atau tidak dapat ditulisi. Siapkan folder backend/uploads/materi terlebih dahulu.'
              );
              error.cause = storageError;
              throw error;
            }

            const filename = `${crypto.randomUUID()}${extension}`;
            const filePath = path.join(absoluteDestination, filename);
            await fs.promises.writeFile(filePath, req.file.buffer, { flag: 'wx' });
            Object.assign(req.file, { filename, path: filePath, destination: absoluteDestination });
            return next();
          } catch (error) {
            return next(error);
          }
        });
      };
    },
  };
}

module.exports = { secureMaterialUpload };
