const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Resume = require('../models/Resume');

/**
 * Helper function to match job against candidate skills and designation.
 * Returns match score (0-100%) and clear bulleted reasons.
 */
function calculateJobMatch(job, candidateSkills = [], candidateDesignation = '') {
  let score = 30; // Base match score
  const reasons = [];

  const jobTitle = job.title.toLowerCase();
  const jobDesc = job.description.toLowerCase();
  const designation = candidateDesignation.toLowerCase();

  // 1. Designation / Title match
  if (designation && (jobTitle.includes(designation) || designation.includes(jobTitle.split(' ')[0]))) {
    score += 35;
    reasons.push(`Role title matches your background (${job.title})`);
  } else if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('software')) {
    score += 15;
    reasons.push('Matches software engineering domain');
  }

  // 2. Skills overlap
  const matchedSkills = [];
  candidateSkills.forEach(skill => {
    const skillRegex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (job.skills.some(s => s.toLowerCase() === skill.toLowerCase()) || skillRegex.test(jobDesc)) {
      matchedSkills.push(skill);
    }
  });

  if (matchedSkills.length > 0) {
    const skillBonus = Math.min(matchedSkills.length * 10, 35);
    score += skillBonus;
    reasons.push(`Key matching skills: ${matchedSkills.join(', ')}`);
  } else {
    reasons.push('Relevant tech stack alignment');
  }

  // 3. Remote bonus
  if (job.isRemote) {
    reasons.push('Remote flexibility');
  }

  const finalScore = Math.min(Math.max(score, 40), 98); // Bound score between 40% and 98%

  return {
    matchScore: finalScore,
    matchReasons: reasons,
    matchedSkills
  };
}

/**
 * GET /api/jobs
 * Search and filter job listings.
 * Query parameters: query, remote, location, skill, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { query, remote, location, skill, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (remote === 'true') {
      filter.isRemote = true;
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (skill) {
      filter.skills = { $elemMatch: { $regex: skill, $options: 'i' } };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalJobs = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      total: totalJobs,
      page: parseInt(page),
      totalPages: Math.ceil(totalJobs / parseInt(limit)),
      jobs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/jobs/match
 * Recommends best-matching jobs based on uploaded resume or custom criteria.
 */
router.post('/match', async (req, res) => {
  try {
    const { resumeId, skills, designation, remoteOnly, limit = 10 } = req.body;

    let candidateSkills = skills || [];
    let candidateDesignation = designation || '';

    // If resumeId provided, fetch skills & designation from DB
    if (resumeId) {
      const resume = await Resume.findById(resumeId);
      if (resume) {
        candidateSkills = resume.skills || [];
        candidateDesignation = resume.designation || '';
      }
    } else if (candidateSkills.length === 0 && !candidateDesignation) {
      // Fall back to latest resume in DB if available
      const latestResume = await Resume.findOne().sort({ createdAt: -1 });
      if (latestResume) {
        candidateSkills = latestResume.skills || [];
        candidateDesignation = latestResume.designation || '';
      }
    }

    const filter = {};
    if (remoteOnly) {
      filter.isRemote = true;
    }

    const allJobs = await Job.find(filter).limit(300);

    const scoredJobs = allJobs.map(job => {
      const matchResult = calculateJobMatch(job, candidateSkills, candidateDesignation);
      return {
        ...job.toObject(),
        matchScore: matchResult.matchScore,
        matchReasons: matchResult.matchReasons,
        matchedSkills: matchResult.matchedSkills
      };
    });

    // Sort descending by match score
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      candidateProfile: {
        designation: candidateDesignation,
        skills: candidateSkills
      },
      jobs: scoredJobs.slice(0, parseInt(limit))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get single job by ID
 */
router.get('/:jobId', async (req, res) => {
  try {
    const job = await Job.findOne({ jobId: req.params.jobId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    return res.json({ success: true, job });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;