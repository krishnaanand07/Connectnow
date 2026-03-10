const Message = require('../models/Message');

// @desc    Get messages between current user and a selected user
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type } = req.body;
    const senderId = req.user._id;

    let fileUrl = null;
    if (req.file) {
      fileUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      type: type || (req.file ? 'file' : 'text'),
      fileUrl
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:userId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params; // The user who sent the messages
    const currentUserId = req.user._id;

    await Message.updateMany(
      { sender: userId, receiver: currentUserId, readStatus: false },
      { $set: { readStatus: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead
};
