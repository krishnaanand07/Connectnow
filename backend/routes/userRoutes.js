const express = require('express');
const router = express.Router();
const { searchUsers, updateAvatar, getContacts, addContact } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');

router.route('/search').get(protect, searchUsers);
router.route('/avatar').put(protect, upload.single('avatar'), updateAvatar);
router.route('/contacts').get(protect, getContacts).post(protect, addContact);

module.exports = router;
