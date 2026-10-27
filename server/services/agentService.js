const Job = require('../models/Job');
const Resume = require('../models/Resume');
const Application = require('../models/Application');

const SKILLS_LIST = [
  'React',
  'React Native',
  'Vue',
  'Vue.js',
  'Angular',
  'Next.js',
  'Node.js',
  'Express',
  'Python',
  'Java',
  'C++',
  'C#',
  'JavaScript',
  'TypeScript',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'AWS',
  'Docker',
  'Kubernetes',
  'HTML',
  'CSS',
  'Tailwind',
  'Redux',
  'Machine Learning',
  'AI',
  'Go',
  'Golang'
];

function normaliseText(value) {
  return String(value || '').toLowerCase().trim();
}

function escapeRegex(value) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function extractSkillsFromMessage(message) {
  return SKILLS_LIST.filter((skill) => {
    const skillRegex = new RegExp(
      `\\b${escapeRegex(skill)}\\b`,
      'i'
    );

    return skillRegex.test(message);
  });
}

function extractJobId(message) {
  const match = message.match(
    /\b(remotive|jobicy|themuse)-[a-z0-9-]+\b/i
  );

  return match ? match[0] : null;
}

function isApplicationStatusRequest(message) {
  const text = normaliseText(message);

  return (
    text.includes('my application') ||
    text.includes('applied job') ||
    text.includes('application status') ||
    text.includes('status of my application') ||
    text === 'applications'
  );
}

function isApplicationRequest(message) {
  const text = normaliseText(message);

  return (
    text.startsWith('apply') ||
    text.includes('apply to') ||
    text.includes('apply for')
  );
}

function isResumeRequest(message) {
  const text = normaliseText(message);

  return (
    text.includes('my resume') ||
    text.includes('extracted skills') ||
    text.includes('profile summary') ||
    text.includes('my background')
  );
}

function calculateExperienceScore(job, experience = []) {
  const requiredExperience = normaliseText(
    job.requiredExperience
  );

  if (
    !requiredExperience ||
    requiredExperience.includes('not specified') ||
    experience.length === 0
  ) {
    return 0;
  }

  const requiredYearsMatch = requiredExperience.match(/\d+/);

  const candidateExperienceText = experience
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      return [
        item.title,
        item.company,
        item.duration,
        item.description
      ].filter(Boolean).join(' ');
    })
    .join(' ');

  const candidateYearsMatch = candidateExperienceText.match(
    /\d+/
  );

  if (!requiredYearsMatch || !candidateYearsMatch) {
    return 0;
  }

  const requiredYears = Number(requiredYearsMatch[0]);
  const candidateYears = Number(candidateYearsMatch[0]);

  return candidateYears >= requiredYears ? 15 : 0;
}

function scoreJob(job, profile, querySkills) {
  const reasons = [];
  let score = 30;

  const jobTitle = normaliseText(job.title);
  const jobDescription = normaliseText(job.description);
  const designation = normaliseText(profile.designation);

  if (
    designation &&
    (
      jobTitle.includes(designation) ||
      designation.includes(jobTitle)
    )
  ) {
    score += 25;
    reasons.push(
      `Role aligns with your designation: ${profile.designation}`
    );
  }

  const matchingResumeSkills = (profile.skills || []).filter(
    (skill) => {
      const skillText = normaliseText(skill);

      return (
        job.skills.some(
          (jobSkill) =>
            normaliseText(jobSkill) === skillText
        ) ||
        jobDescription.includes(skillText)
      );
    }
  );

  if (matchingResumeSkills.length > 0) {
    score += Math.min(matchingResumeSkills.length * 8, 30);
    reasons.push(
      `Matches resume skills: ${matchingResumeSkills
        .slice(0, 5)
        .join(', ')}`
    );
  }

  const matchingQuerySkills = querySkills.filter((skill) => {
    const skillText = normaliseText(skill);

    return (
      job.skills.some(
        (jobSkill) =>
          normaliseText(jobSkill) === skillText
      ) ||
      jobDescription.includes(skillText)
    );
  });

  if (matchingQuerySkills.length > 0) {
    score += Math.min(matchingQuerySkills.length * 10, 25);
    reasons.push(
      `Matches requested skills: ${matchingQuerySkills.join(', ')}`
    );
  }

  const experienceScore = calculateExperienceScore(
    job,
    profile.experience || []
  );

  if (experienceScore > 0) {
    score += experienceScore;
    reasons.push('Experience level matches the role requirements');
  }

  if (job.isRemote) {
    reasons.push('Remote flexibility');
  }

  return {
    ...job.toObject(),
    matchScore: Math.min(score, 98),
    matchReasons: reasons.length > 0
      ? Array.from(new Set(reasons))
      : ['Relevant job listing']
  };
}

async function getLatestResume() {
  return Resume.findOne().sort({ createdAt: -1 });
}

async function getApplicationStatus() {
  const applications = await Application.find()
    .sort({ appliedAt: -1 });

  if (applications.length === 0) {
    return {
      reply:
        "You have not recorded any applications yet.",
      intent: 'GET_APPLICATIONS',
      data: {
        applications: []
      }
    };
  }

  return {
    reply:
      `You have recorded ${applications.length} application(s).`,
    intent: 'GET_APPLICATIONS',
    data: {
      applications
    }
  };
}

async function applyToJob(message) {
  const jobId = extractJobId(message);
  let targetJob = null;

  if (jobId) {
    targetJob = await Job.findOne({ jobId });

    if (!targetJob) {
      return {
        reply:
          `I could not find a job with ID "${jobId}". Please check the job ID and try again.`,
        intent: 'INVALID_JOB_REFERENCE',
        data: {
          jobId
        }
      };
    }
  } else {
    const searchPhrase = message
      .replace(/apply\s*(to|for)?/i, '')
      .trim();

    if (searchPhrase.length > 2) {
      targetJob = await Job.findOne({
        $or: [
          {
            title: {
              $regex: searchPhrase,
              $options: 'i'
            }
          },
          {
            company: {
              $regex: searchPhrase,
              $options: 'i'
            }
          }
        ]
      });
    }
  }

  if (!targetJob) {
    return {
      reply:
        'Please specify a job ID, job title, or company name.',
      intent: 'APPLY_JOB_AMBIGUOUS'
    };
  }

  const existingApplication = await Application.findOne({
    jobId: targetJob.jobId
  });

  if (existingApplication) {
    return {
      reply:
        `You have already recorded an application for ${targetJob.title}.`,
      intent: 'APPLY_JOB_EXISTS',
      data: {
        application: existingApplication,
        job: targetJob
      }
    };
  }

  try {
    const application = await Application.create({
      jobId: targetJob.jobId,
      jobTitle: targetJob.title,
      company: targetJob.company,
      location: targetJob.location,
      status: 'Submitted',
      notes:
        'Recorded locally. This does not submit an application to the external job platform.'
    });

    return {
      reply:
        `Application recorded locally for ${targetJob.title} at ${targetJob.company}.`,
      intent: 'APPLY_JOB_SUCCESS',
      data: {
        application,
        job: targetJob
      }
    };
  } catch (error) {
    if (error.code === 11000) {
      const application = await Application.findOne({
        jobId: targetJob.jobId
      });

      return {
        reply:
          `You have already recorded an application for ${targetJob.title}.`,
        intent: 'APPLY_JOB_EXISTS',
        data: {
          application,
          job: targetJob
        }
      };
    }

    throw error;
  }
}

async function getResumeInfo(resume) {
  if (!resume) {
    return {
      reply:
        'Please upload a PDF or DOCX resume before requesting your profile.',
      intent: 'RESUME_INFO',
      data: null
    };
  }

  return {
    reply:
      `Here is the information extracted from ${resume.fileName}.`,
    intent: 'RESUME_INFO',
    data: {
      resume
    }
  };
}

async function recommendJobs(message, resume, history) {
  const queryText = normaliseText(message);
  const isRemoteRequested =
    queryText.includes('remote') ||
    queryText.includes('work from home');

  const querySkills = extractSkillsFromMessage(
    `${history.join(' ')} ${message}`
  );

  const filter = {};

  if (isRemoteRequested) {
    filter.isRemote = true;
  }

  if (querySkills.length > 0) {
    filter.skills = {
      $elemMatch: {
        $regex: querySkills[0],
        $options: 'i'
      }
    };
  }

  const rawJobs = await Job.find(filter)
    .limit(300);

  if (rawJobs.length === 0) {
    return {
      reply:
        'I could not find jobs matching those requirements. Try removing a filter or using a broader role.',
      intent: 'NO_MATCHING_JOBS',
      data: {
        jobs: [],
        filtersApplied: {
          remoteOnly: isRemoteRequested,
          querySkills
        }
      }
    };
  }

  const profile = {
    designation: resume?.designation || '',
    skills: resume?.skills || [],
    experience: resume?.experience || []
  };

  const scoredJobs = rawJobs
    .map((job) => scoreJob(job, profile, querySkills))
    .sort((first, second) =>
      second.matchScore - first.matchScore
    )
    .slice(0, 10);

  return {
    reply:
      `Found ${scoredJobs.length} matching job listing(s).`,
    intent: 'JOB_RECOMMENDATIONS',
    data: {
      jobs: scoredJobs,
      filtersApplied: {
        remoteOnly: isRemoteRequested,
        querySkills
      }
    }
  };
}

/**
 * Main orchestrator.
 */
async function processChatMessage({
  message,
  history = []
}) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message text is required.');
  }

  if (!Array.isArray(history)) {
    throw new Error('Conversation history must be an array.');
  }

  const resume = await getLatestResume();

  const historyText = history
    .slice(-10)
    .map((item) => item.content || '')
    .filter(Boolean);

  if (isApplicationStatusRequest(message)) {
    return getApplicationStatus();
  }

  if (isApplicationRequest(message)) {
    return applyToJob(message);
  }

  if (isResumeRequest(message)) {
    return getResumeInfo(resume);
  }

  return recommendJobs(message, resume, historyText);
}

module.exports = {
  processChatMessage
};