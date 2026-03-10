const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');

router.route('/:userId').get(protect, getMessages);
router.route('/').post(protect, upload.single('file'), sendMessage);
router.route('/:userId/read').put(protect, markAsRead);

module.exports = router;
