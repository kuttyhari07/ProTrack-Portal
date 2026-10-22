const express = require('express');
const router = express.Router();
const {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember, restrictViewerMutations } = require('../middleware/workspace');
const upload = require('../middleware/upload');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/', getDocuments);
router.post('/upload', restrictViewerMutations, upload.single('file'), uploadDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', restrictViewerMutations, deleteDocument);

module.exports = router;
