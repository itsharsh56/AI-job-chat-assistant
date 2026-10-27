const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');

const router = express.Router();

router.post('/apply', async (req, res) => {
  const { jobId } = req.body;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'A valid job ID is required.'
    });
  }

  try {
    const job = await Job.findOne({ jobId });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: `No job was found with ID "${jobId}".`
      });
    }

    const existingApplication = await Application.findOne({
      jobId
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message:
          'You have already recorded an application for this job.',
        application: existingApplication
      });
    }

    const application = await Application.create({
      jobId: job.jobId,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      status: 'Submitted',
      notes:
        'Recorded locally. This does not submit an application to the external job platform.'
    });

    return res.status(201).json({
      success: true,
      message:
        `Application recorded locally for ${job.title} at ${job.company}.`,
      application
    });
  } catch (error) {
    if (error.code === 11000) {
      const existingApplication = await Application.findOne({
        jobId
      });

      return res.status(409).json({
        success: false,
        message:
          'You have already recorded an application for this job.',
        application: existingApplication
      });
    }

    console.error('Application creation failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to record the application.'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const applications = await Application.find()
      .sort({ appliedAt: -1 });

    return res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Unable to fetch applications:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch applications.'
    });
  }
});

router.get('/status/:jobId', async (req, res) => {
  try {
    const application = await Application.findOne({
      jobId: req.params.jobId
    });

    return res.json({
      success: true,
      isApplied: Boolean(application),
      application: application || null
    });
  } catch (error) {
    console.error('Unable to fetch application status:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch application status.'
    });
  }
});

module.exports = router;