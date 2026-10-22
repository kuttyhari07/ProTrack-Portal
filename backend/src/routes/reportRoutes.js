const express = require('express');
const router = express.Router();
const {
  getWorkspaceReportData,
  exportCSV
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/workspace', getWorkspaceReportData);
router.get('/export-csv', exportCSV);

module.exports = router;
