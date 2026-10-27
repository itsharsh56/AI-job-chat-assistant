const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  name: { type: String, default: 'Applicant' },
  contactDetails: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' }
  },
  designation: { type: String, default: 'Software Engineer' },
  skills: [{ type: String }],
  experience: [{
    title: { type: String },
    company: { type: String },
    duration: { type: String },
    description: { type: String }
  }],
  education: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: String }
  }],
  projects: [{
    name: { type: String },
    description: { type: String },
    technologies: [{ type: String }]
  }],
  rawText: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);