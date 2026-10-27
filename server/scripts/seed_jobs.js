const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const dns = require('dns');
const Job = require('../models/Job');

dotenv.config({
  path: path.join(__dirname, '../.env')
});

// dns.setDefaultResultOrder('ipv4first');
// dns.setServers(['8.8.8.8', '1.1.1.1']);

const HTTP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json'
};

const SKILLS_LIST = [
  'React',
  'React Native',
  'Vue',
  'Vue.js',
  'Angular',
  'Next.js',
  'Nuxt.js',
  'Svelte',
  'Node.js',
  'Express',
  'Express.js',
  'NestJS',
  'Django',
  'Flask',
  'FastAPI',
  'Ruby on Rails',
  'Spring Boot',
  'Laravel',
  'ASP.NET',
  'GraphQL',
  'REST API',
  'gRPC',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'Go',
  'Golang',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Scala',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'DynamoDB',
  'Elasticsearch',
  'Cassandra',
  'SQLite',
  'AWS',
  'Azure',
  'GCP',
  'Google Cloud',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Ansible',
  'CI/CD',
  'Jenkins',
  'GitHub Actions',
  'HTML',
  'CSS',
  'Tailwind',
  'Tailwind CSS',
  'Bootstrap',
  'Sass',
  'Redux',
  'Zustand',
  'Webpack',
  'Vite',
  'Git',
  'Linux',
  'Microservices',
  'System Design',
  'Agile',
  'Scrum',
  'Jira',
  'Machine Learning',
  'AI',
  'TensorFlow',
  'PyTorch',
  'OpenAI',
  'LLM',
  'Data Science',
  'Pandas',
  'NumPy',
  'Cybersecurity',
  'OAuth',
  'JWT',
  'Unit Testing',
  'Jest',
  'Cypress',
  'Playwright'
];

const REQUIRED_JOB_FIELDS = [
  'jobId',
  'title',
  'company',
  'location',
  'requiredExperience',
  'skills',
  'description',
  'sourceLink'
];

function extractSkills(text) {
  if (!text) {
    return [];
  }

  const foundSkills = new Set();

  SKILLS_LIST.forEach((skill) => {
    const escapedSkill = skill.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    );

    const skillRegex = new RegExp(
      `\\b${escapedSkill}\\b`,
      'i'
    );

    if (skillRegex.test(text)) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}

function cleanDescription(htmlOrText) {
  if (!htmlOrText) {
    return '';
  }

  return String(htmlOrText)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseExperience(text) {
  if (!text) {
    return 'Not specified';
  }

  const match = text.match(
    /(\d+\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?))/i
  );

  return match ? match[0] : 'Not specified';
}

function validateJobs(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error('The job dataset must be an array.');
  }

  if (jobs.length < 1500 || jobs.length > 2000) {
    throw new Error(
      `Dataset must contain between 1,500 and 2,000 jobs. Found ${jobs.length}.`
    );
  }

  const invalidJobs = jobs.filter((job) => {
    return REQUIRED_JOB_FIELDS.some((field) => {
      const value = job[field];

      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {
        return true;
      }

      if (
        field === 'skills' &&
        (!Array.isArray(value) || value.length === 0)
      ) {
        return true;
      }

      return false;
    });
  });

  if (invalidJobs.length > 0) {
    const examples = invalidJobs
      .slice(0, 10)
      .map((job) => job.jobId || 'unknown-job')
      .join(', ');

    throw new Error(
      `${invalidJobs.length} jobs are missing required fields. Examples: ${examples}`
    );
  }
}

async function fetchFromRemotive() {
  console.log('Fetching real jobs from Remotive API...');

  const categories = [
    'software-dev',
    'devops',
    'data',
    'design',
    'product',
    'qa'
  ];

  let allJobs = [];

  for (const category of categories) {
    try {
      const response = await fetch(
        `https://remotive.com/api/remote-jobs?category=${category}`,
        {
          headers: HTTP_HEADERS
        }
      );

      if (!response.ok) {
        console.error(
          `Remotive returned ${response.status} for ${category}`
        );
        continue;
      }

      const data = await response.json();

      if (!Array.isArray(data.jobs)) {
        continue;
      }

      const categoryJobs = data.jobs
        .map((job) => {
          const cleanedDescription = cleanDescription(
            job.description
          );

          const tagSkills = Array.isArray(job.tags)
            ? job.tags
            : [];

          const extractedSkills = extractSkills(
            cleanedDescription
          );

          const combinedSkills = Array.from(
            new Set([...tagSkills, ...extractedSkills])
          );

          return {
            jobId: `remotive-${job.id}`,
            title: String(job.title || '').trim(),
            company: String(
              job.company_name || 'Unknown Company'
            ).trim(),
            location:
              job.candidate_required_location ||
              'Worldwide',
            isRemote: true,
            requiredExperience:
              parseExperience(cleanedDescription),
            skills: combinedSkills
              .filter(Boolean)
              .slice(0, 10),
            description:
              cleanedDescription.slice(0, 2000),
            sourceLink:
              job.url || 'https://remotive.com',
            postedDate: job.publication_date
              ? new Date(job.publication_date)
              : new Date()
          };
        })
        .filter((job) => job.skills.length > 0);

      allJobs = allJobs.concat(categoryJobs);
    } catch (error) {
      console.error(
        `Error fetching Remotive category ${category}:`,
        error.message
      );
    }
  }

  return allJobs;
}

async function fetchFromTheMuse() {
  console.log(
    'Fetching real jobs from The Muse API...'
  );

  const jobs = [];

  try {
    for (let page = 0; page < 85; page += 1) {
      const response = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}`,
        {
          headers: HTTP_HEADERS
        }
      );

      if (!response.ok) {
        console.error(
          `The Muse returned ${response.status} on page ${page}`
        );
        break;
      }

      const data = await response.json();

      if (
        !Array.isArray(data.results) ||
        data.results.length === 0
      ) {
        break;
      }

      const pageJobs = data.results
        .map((job) => {
          const cleanedDescription = cleanDescription(
            job.contents
          );

          const locations = Array.isArray(job.locations)
            ? job.locations
                .map((location) => location.name)
                .filter(Boolean)
                .join(', ')
            : 'Flexible';

          const isRemote =
            locations.toLowerCase().includes('flexible') ||
            locations.toLowerCase().includes('remote');

          const skills = extractSkills(
            cleanedDescription
          );

          return {
            jobId: `themuse-${job.id}`,
            title: String(job.name || '').trim(),
            company: String(
              job.company?.name || 'Unknown Company'
            ).trim(),
            location: locations || 'United States',
            isRemote,
            requiredExperience:
              parseExperience(cleanedDescription),
            skills: skills.slice(0, 10),
            description:
              cleanedDescription.slice(0, 2000),
            sourceLink:
              job.refs?.landing_page ||
              'https://www.themuse.com',
            postedDate: job.publication_date
              ? new Date(job.publication_date)
              : new Date()
          };
        })
        .filter((job) => job.skills.length > 0);

      jobs.push(...pageJobs);
    }
  } catch (error) {
    console.error(
      'Error fetching jobs from The Muse:',
      error.message
    );
  }

  return jobs;
}

async function fetchFromJobicy() {
  console.log('Fetching real jobs from Jobicy API...');

  try {
    const response = await fetch(
      'https://jobicy.com/api/v2/remote-jobs?count=100',
      {
        headers: HTTP_HEADERS
      }
    );

    if (!response.ok) {
      console.error(
        `Jobicy returned ${response.status}`
      );

      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs
      .map((job) => {
        const cleanedDescription = cleanDescription(
          job.jobDescription
        );

        const skills = extractSkills(
          cleanedDescription
        );

        return {
          jobId: `jobicy-${job.id}`,
          title: String(job.jobTitle || '').trim(),
          company: String(
            job.companyName || 'Unknown Company'
          ).trim(),
          location: job.jobGeo || 'Worldwide',
          isRemote: true,
          requiredExperience:
            parseExperience(cleanedDescription),
          skills: skills.slice(0, 10),
          description:
            cleanedDescription.slice(0, 2000),
          sourceLink:
            job.url || 'https://jobicy.com',
          postedDate: job.pubDate
            ? new Date(job.pubDate)
            : new Date()
        };
      })
      .filter((job) => job.skills.length > 0);
  } catch (error) {
    console.error(
      'Error fetching jobs from Jobicy:',
      error.message
    );

    return [];
  }
}

async function seed() {
  console.log(
    '--- Starting real job data collection ---'
  );

  const [
    remotiveJobs,
    museJobs,
    jobicyJobs
  ] = await Promise.all([
    fetchFromRemotive(),
    fetchFromTheMuse(),
    fetchFromJobicy()
  ]);

  const rawJobs = [
    ...remotiveJobs,
    ...museJobs,
    ...jobicyJobs
  ];

  console.log(
    `Fetched total raw job listings: ${rawJobs.length}`
  );

  const uniqueJobsById = new Map();
  const uniqueJobsByTitleAndCompany = new Map();

  rawJobs.forEach((job) => {
    const normalizedTitle = job.title
      .toLowerCase()
      .trim();

    const normalizedCompany = job.company
      .toLowerCase()
      .trim();

    const titleCompanyKey =
      `${normalizedTitle}_${normalizedCompany}`;

    if (
      !uniqueJobsById.has(job.jobId) &&
      !uniqueJobsByTitleAndCompany.has(titleCompanyKey)
    ) {
      uniqueJobsById.set(job.jobId, job);
      uniqueJobsByTitleAndCompany.set(
        titleCompanyKey,
        job
      );
    }
  });

  const uniqueJobs = Array.from(
    uniqueJobsById.values()
  );

  console.log(
    `Unique job listings after deduplication: ${uniqueJobs.length}`
  );

  validateJobs(uniqueJobs);

  const dataDirectory = path.join(
    __dirname,
    '../data'
  );

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, {
      recursive: true
    });
  }

  const jsonFilePath = path.join(
    dataDirectory,
    'jobs.json'
  );

  fs.writeFileSync(
    jsonFilePath,
    JSON.stringify(uniqueJobs, null, 2),
    'utf-8'
  );

  console.log(
    `Saved ${uniqueJobs.length} real jobs to server/data/jobs.json`
  );

  if (!process.env.MONGO_URI) {
    throw new Error(
      'MONGO_URI is missing in server/.env.'
    );
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log(
      'Connected to MongoDB for seeding.'
    );

    await Job.deleteMany({});

    console.log('Cleared existing jobs collection.');

    await Job.insertMany(uniqueJobs);

    console.log(
      `Successfully seeded ${uniqueJobs.length} jobs into MongoDB.`
    );
  } finally {
    await mongoose.disconnect();

    console.log(
      'MongoDB disconnected cleanly.'
    );
  }
}

seed().catch((error) => {
  console.error('Job seeding failed:', error);
  process.exitCode = 1;
});