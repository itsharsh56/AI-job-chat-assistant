const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  title: { 
    type: String, 
    required: true, 
    index: true 
  },
  company: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  isRemote: { 
    type: Boolean, 
    default: false 
  },
  requiredExperience: { 
    type: String, 
    default: 'Not specified' 
  },
  skills: [{ 
    type: String, 
    index: true 
  }],
  description: { 
    type: String, 
    required: true 
  },
  sourceLink: { 
    type: String, 
    required: true 
  },
  postedDate: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);