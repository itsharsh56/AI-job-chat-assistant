const express = require('express');
const multer = require('multer');
const Resume = require('../models/Resume');
const {
  extractTextFromBuffer,
  parseResumeTextRuleBased
} = require('../utils/resumeParser');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    const allowedExtension = /\.(pdf|docx|doc)$/i.test(
      file.originalname
    );

    if (
      allowedMimeTypes.includes(file.mimetype) &&
      allowedExtension
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error('Invalid file type. Only PDF and DOCX files are allowed.')
    );
  }
});

router.post('/upload', (req, res) => {
  upload.single('resume')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please select a PDF or DOCX resume to upload.'
        });
      }

      let rawText;

      try {
        rawText = await extractTextFromBuffer(
          req.file.buffer,
          req.file.mimetype
        );
      } catch (extractionError) {
        console.error(
          'Resume extraction failed:',
          extractionError
        );

        return res.status(422).json({
          success: false,
          message:
            'The uploaded resume could not be read. Please upload a valid PDF or DOCX file.'
        });
      }

      if (!rawText || !rawText.trim()) {
        return res.status(422).json({
          success: false,
          message:
            'The uploaded resume does not contain readable text.'
        });
      }

      const parsedData = parseResumeTextRuleBased(rawText);

      const savedResume = await Resume.create({
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        name: parsedData.name || 'Applicant',
        contactDetails: parsedData.contactDetails || {},
        designation: parsedData.designation || '',
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        rawText
      });

      return res.status(201).json({
        success: true,
        message: 'Resume uploaded and processed successfully.',
        data: savedResume
      });
    } catch (error) {
      console.error('Error during resume upload:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to process the uploaded resume.'
      });
    }
  });
});

router.get('/latest', async (req, res) => {
  try {
    const latestResume = await Resume.findOne()
      .sort({ createdAt: -1 });

    if (!latestResume) {
      return res.status(404).json({
        success: false,
        message: 'No resume has been uploaded yet.'
      });
    }

    return res.json({
      success: true,
      data: latestResume
    });
  } catch (error) {
    console.error('Unable to fetch latest resume:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch the latest resume.'
    });
  }
});

module.exports = router;