const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['missed', 'completed', 'rejected'],
    default: 'missed'
  },
  duration: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Call', callSchema);
