const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Interviewing',
        'Rejected',
        'Accepted'
      ],
      default: 'Submitted'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: 'Recorded locally via AI Job Chat Assistant'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'Application',
  applicationSchema
);