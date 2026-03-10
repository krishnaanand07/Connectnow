const User = require('../models/User');

// @desc    Search users by name or email
// @route   GET /api/users/search?q=
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.q
      ? {
          $or: [
            { name: { $regex: req.query.q, $options: 'i' } },
            { email: { $regex: req.query.q, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
      .select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const fileUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    
    const user = await User.findById(req.user._id);
    user.avatar = fileUrl;
    await user.save();

    res.json({ avatar: fileUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's contacts
// @route   GET /api/users/contacts
// @access  Private
const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('contacts', '-password');
    res.json(user.contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add user to contacts
// @route   POST /api/users/contacts
// @access  Private
const addContact = async (req, res) => {
  try {
    const { contactId } = req.body;
    
    if (contactId === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const user = await User.findById(req.user._id);
    if (user.contacts.includes(contactId)) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    user.contacts.push(contactId);
    await user.save();

    // Optionally add current user to contact's contacts list
    // const contact = await User.findById(contactId);
    // contact.contacts.push(req.user._id);
    // await contact.save();

    const newContact = await User.findById(contactId).select('-password');
    res.json(newContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchUsers,
  updateAvatar,
  getContacts,
  addContact
};
