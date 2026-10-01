const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const express = require('express');
const controller = require('../controllers/homepageController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();
const adminRouter = express.Router();
const uploadRoot = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const homepageUploadDir = path.join(uploadRoot, 'homepage');
fs.mkdirSync(homepageUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, homepageUploadDir),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return callback(new Error('File harus berupa gambar JPG, PNG, atau WebP.'));
    }
    callback(null, true);
  },
});

const withKind = (kind) => (req, res, next) => {
  req.homepageKind = kind;
  next();
};

router.get('/public/homepage', controller.getPublicHomepage);

adminRouter.use(requireAuth, requireRole('admin_logistik'));

adminRouter.get('/slides', controller.listSlides);
adminRouter.post('/slides', imageUpload.single('image'), controller.createSlide);
adminRouter.put('/slides/:id', imageUpload.single('image'), controller.updateSlide);
adminRouter.delete('/slides/:id', controller.deleteSlide);

adminRouter.put('/about', controller.updateAbout);

adminRouter.get('/bidang', withKind('bidang'), controller.listUnits);
adminRouter.post('/bidang', withKind('bidang'), imageUpload.single('image'), controller.createUnit);
adminRouter.put('/bidang/:id', withKind('bidang'), imageUpload.single('image'), controller.updateUnit);
adminRouter.delete('/bidang/:id', withKind('bidang'), controller.deleteUnit);

adminRouter.get('/bkm', withKind('bkm'), controller.listUnits);
adminRouter.post('/bkm', withKind('bkm'), imageUpload.single('image'), controller.createUnit);
adminRouter.put('/bkm/:id', withKind('bkm'), imageUpload.single('image'), controller.updateUnit);
adminRouter.delete('/bkm/:id', withKind('bkm'), controller.deleteUnit);

adminRouter.get('/kegiatan', controller.listActivities);
adminRouter.post('/kegiatan', imageUpload.single('image'), controller.createActivity);
adminRouter.put('/kegiatan/:id', imageUpload.single('image'), controller.updateActivity);
adminRouter.delete('/kegiatan/:id', controller.deleteActivity);

router.use('/admin/homepage', adminRouter);

module.exports = router;
