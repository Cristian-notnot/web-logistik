const path = require('path');
const express = require('express');
const controller = require('../controllers/homepageController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { secureImageUpload } = require('../middleware/secureImageUpload');

const router = express.Router();
const adminRouter = express.Router();
const uploadRoot = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const homepageUploadDir = path.join(uploadRoot, 'homepage');
const imageUpload = secureImageUpload(homepageUploadDir);

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

adminRouter.get('/bph', controller.listBph);
adminRouter.put('/bph/:id', imageUpload.single('image'), controller.updateBph);

adminRouter.get('/kegiatan', controller.listActivities);
adminRouter.post('/kegiatan', imageUpload.single('image'), controller.createActivity);
adminRouter.put('/kegiatan/:id', imageUpload.single('image'), controller.updateActivity);
adminRouter.delete('/kegiatan/:id', controller.deleteActivity);

adminRouter.get('/berita', controller.listNews);
adminRouter.post('/berita', imageUpload.single('image'), controller.createNews);
adminRouter.put('/berita/:id', imageUpload.single('image'), controller.updateNews);
adminRouter.delete('/berita/:id', controller.deleteNews);

router.use('/admin/homepage', adminRouter);

module.exports = router;
