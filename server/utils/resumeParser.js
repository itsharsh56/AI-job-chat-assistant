const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts plain text from a PDF or DOC/DOCX buffer.
 */
async function extractTextFromBuffer(fileBuffer, mimeType) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('File buffer is empty.');
  }

  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: fileBuffer });

    try {
      const pdfData = await parser.getText();
      return pdfData.text || '';
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const docxResult = await mammoth.extractRawText({
      buffer: fileBuffer
    });

    return docxResult.value || '';
  }

  throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
}

function cleanLine(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHeading(line) {
  const headings = [
    'experience',
    'work experience',
    'professional experience',
    'employment history',
    'education',
    'academic background',
    'projects',
    'personal projects',
    'academic projects',
    'technical skills',
    'skills',
    'certifications',
    'achievements',
    'summary',
    'profile',
    'objective'
  ];

  return headings.includes(cleanLine(line).toLowerCase());
}

function extractSection(lines, headings) {
  const headingIndex = lines.findIndex((line) => {
    const normalizedLine = cleanLine(line).toLowerCase();

    return headings.some((heading) => normalizedLine === heading);
  });

  if (headingIndex === -1) {
    return [];
  }

  const sectionLines = [];

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const currentLine = cleanLine(lines[index]);

    if (isHeading(currentLine)) {
      break;
    }

    if (currentLine) {
      sectionLines.push(currentLine);
    }
  }

  return sectionLines;
}

function convertExperience(lines) {
  if (lines.length === 0) {
    return [];
  }

  return [
    {
      title: '',
      company: '',
      duration: '',
      description: lines.join(' ')
    }
  ];
}

function convertEducation(lines) {
  if (lines.length === 0) {
    return [];
  }

  return [
    {
      degree: lines.join(' '),
      institution: '',
      year: ''
    }
  ];
}

function convertProjects(lines) {
  if (lines.length === 0) {
    return [];
  }

  return [
    {
      name: '',
      description: lines.join(' '),
      technologies: []
    }
  ];
}

function escapeRegex(value) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Parses the extracted resume text into the schema used by Resume.js.
 */
function parseResumeTextRuleBased(text) {
  if (!text || typeof text !== 'string') {
    return {
      name: '',
      contactDetails: {
        email: '',
        phone: '',
        location: ''
      },
      designation: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      rawText: ''
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );

  const phoneMatch = text.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );

  const locationMatch = text.match(
    /(?:location|based in|address)\s*[:|-]\s*([^\n]+)/i
  );

  const name = lines.length > 0
    ? lines[0].replace(/[^a-zA-Z\s.'-]/g, '').trim()
    : '';

  const knownSkills = [
    'React',
    'React Native',
    'Vue',
    'Vue.js',
    'Angular',
    'Next.js',
    'Node.js',
    'Express',
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'Go',
    'Golang',
    'Ruby',
    'PHP',
    'SQL',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'AWS',
    'Azure',
    'GCP',
    'Docker',
    'Kubernetes',
    'HTML',
    'CSS',
    'Tailwind',
    'Bootstrap',
    'Git',
    'Linux',
    'REST API',
    'GraphQL',
    'Machine Learning',
    'AI',
    'TensorFlow',
    'PyTorch',
    'OpenAI',
    'LLM',
    'Jest',
    'Cypress',
    'Playwright'
  ];

  const foundSkills = new Set();

  knownSkills.forEach((skill) => {
    const skillRegex = new RegExp(
      `\\b${escapeRegex(skill)}\\b`,
      'i'
    );

    if (skillRegex.test(text)) {
      foundSkills.add(skill);
    }
  });

  const experienceLines = extractSection(lines, [
    'experience',
    'work experience',
    'professional experience',
    'employment history'
  ]);

  const educationLines = extractSection(lines, [
    'education',
    'academic background'
  ]);

  const projectLines = extractSection(lines, [
    'projects',
    'personal projects',
    'academic projects'
  ]);

  const designation = lines.length > 1
    ? lines[1]
    : '';

  return {
    name,
    contactDetails: {
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: locationMatch ? cleanLine(locationMatch[1]) : ''
    },
    designation,
    skills: Array.from(foundSkills),
    experience: convertExperience(experienceLines),
    education: convertEducation(educationLines),
    projects: convertProjects(projectLines),
    rawText: text
  };
}

module.exports = {
  extractTextFromBuffer,
  parseResumeTextRuleBased
};