const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/workspace');

router.use(protect);
router.use(requireWorkspaceMember);

router.get('/', globalSearch);

module.exports = router;
