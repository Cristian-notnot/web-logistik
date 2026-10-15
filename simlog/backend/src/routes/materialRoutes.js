const express = require('express');
const path = require('path');
const controller = require('../controllers/materialController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { secureMaterialUpload } = require('../middleware/secureMaterialUpload');

const router = express.Router();
const adminRouter = express.Router();
const uploadRoot = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const materialUpload = secureMaterialUpload(path.join(uploadRoot, 'materi'));

router.get('/public/materi', controller.listPublic);
router.get('/public/materi/:id/file', controller.download);

adminRouter.use(requireAuth, requireRole('admin_logistik'));
adminRouter.get('/', controller.listAdmin);
adminRouter.post('/', materialUpload.single('file'), controller.create);
adminRouter.put('/:id', materialUpload.single('file'), controller.update);
adminRouter.delete('/:id', controller.remove);

router.use('/admin/materi', adminRouter);

module.exports = router;
