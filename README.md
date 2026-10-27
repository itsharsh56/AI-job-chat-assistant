# AI Job Chat Assistant

An AI-oriented conversational job assistant that lets a user upload a resume,
receive matching job recommendations, refine results through chat, record
applications locally, and track application status.

Authentication is not required for this assessment. The current data model is
a single-user MVP.

## Assessment Requirements Covered

- Resume upload in PDF/DOC/DOCX format.
- Resume text extraction and structured profile display.
- 1,500–2,000 real job listings in a JSON dataset.
- Job records with required metadata and source links.
- Conversational job search and filtering.
- Orchestrator-based agent design.
- Local application recording.
- Duplicate application prevention.
- Application status tracking.
- Clear errors for unreadable resumes, no matches, and invalid jobs.
- Public deployment and demo recording.

## Features

### Resume Processing

The assistant accepts PDF, DOC, and DOCX resumes up to 10 MB and displays:

- Name.
- Email, phone, and location when available.
- Designation.
- Skills.
- Experience.
- Education.
- Projects.

### Job Matching

Recommendations use:

- Designation.
- Resume skills.
- Resume experience.
- Job title.
- Job description.
- Required experience.
- User-requested skills.
- Remote and location filters.

Each recommendation includes a match score, match reasons, skills, and the
external source listing.

### Conversational Requests

Examples:

```text
Recommend the best jobs for my profile
```

```text
Show only remote software developer jobs
```

```text
Find jobs requiring React and Node.js
```

```text
Apply to job remotive-2091158
```

```text
Show the status of my applications
```

### Application Tracking

Applications store:

- Job ID.
- Job title.
- Company.
- Location.
- Applied date.
- Status.

Applications are recorded locally. The assistant does not submit external
application forms automatically.

## Technology

### Client

- React.
- Axios.
- Lucide React.
- CSS.

### Server

- Node.js.
- Express.js.
- Mongoose.
- MongoDB.
- Multer.
- `pdf-parse`.
- `mammoth`.

### Job Sources

- Remotive.
- The Muse.
- Jobicy.

## Project Structure

```text
client/
  public/
  src/
    services/
      api.js
    App.js
    App.css
    App.test.js
    index.js

server/
  data/
    jobs.json
  models/
    Application.js
    Job.js
    Resume.js
  routes/
    applicationRoutes.js
    chatRoutes.js
    jobRoutes.js
    resumeRoutes.js
  scripts/
    seed_jobs.js
  services/
    agentService.js
  utils/
    resumeParser.js
  app.js

API.md
ARCHITECTURE.md
DATABASE.md
DESIGN.md
IMPLEMENTATION_PLAN.md
PRD.md
```

## Prerequisites

- Node.js 18 or later.
- npm.
- MongoDB or MongoDB Atlas.

## Backend Setup

Open a terminal:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Start the backend:

```bash
node app.js
```

The backend runs at:

```text
http://localhost:5000
```

## Job Dataset Setup

The collection script fetches and normalizes jobs from the permitted public
sources, removes duplicates, validates required fields, writes
`server/data/jobs.json`, and seeds MongoDB.

From the `server` directory:

```bash
node scripts/seed_jobs.js
```

The final dataset must contain between 1,500 and 2,000 valid records. Every
record must include:

```text
jobId
title
company
location
requiredExperience
skills
description
sourceLink
```

The script must fail instead of writing an invalid or undersized dataset.

## Frontend Setup

Open another terminal:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

## Frontend Environment Variable

Local default:

```text
http://localhost:5000/api
```

Production configuration:

```env
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api
```

## API Summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/resume/upload` | Upload and parse a resume |
| GET | `/api/resume/latest` | Retrieve the latest resume |
| GET | `/api/jobs` | Search and filter jobs |
| POST | `/api/jobs/match` | Match jobs to a profile |
| GET | `/api/jobs/:jobId` | Retrieve one job |
| POST | `/api/chat` | Process a conversational request |
| POST | `/api/applications/apply` | Record an application |
| GET | `/api/applications` | List applications |
| GET | `/api/applications/status/:jobId` | Retrieve application status |

See [API.md](./API.md) for request and response details.

## Agent Architecture

The chat route delegates to an orchestrator in
`server/services/agentService.js`. The orchestrator coordinates:

1. Resume/profile information.
2. Job recommendations.
3. Application recording.
4. Application status retrieval.

See [AGENTS.md](./AGENTS.md) and
[ARCHITECTURE.md](./ARCHITECTURE.md) for the full dataflow.

## Testing

Run frontend tests:

```bash
cd client
npm test -- --watchAll=false --runInBand
```

Build the frontend:

```bash
cd client
npm run build
```

Before submission, manually test:

1. Valid PDF upload.
2. Valid DOCX upload.
3. Unreadable resume.
4. Empty resume.
5. Resume profile display.
6. Recommended jobs.
7. Remote filtering.
8. Skill filtering.
9. No matching jobs.
10. Valid application.
11. Invalid job ID.
12. Duplicate application.
13. Application status.

## Deployment

Frontend URL:

```text
ADD_FRONTEND_DEPLOYMENT_URL_HERE
```

Backend URL:

```text
ADD_BACKEND_DEPLOYMENT_URL_HERE
```

Production environment variables:

```env
# Frontend
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api

# Backend
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Do not commit real credentials or `.env` files.

## Demo Recording

Recording URL:

```text
ADD_3_TO_5_MINUTE_RECORDING_URL_HERE
```

The recording should demonstrate:

1. Resume upload.
2. Resume parsing.
3. Extracted profile details.
4. Job recommendations.
5. Conversational refinement.
6. Applying to a job.
7. Duplicate application handling.
8. Application status tracking.

## Documentation

- [Product requirements](./PRD.md)
- [Architecture](./ARCHITECTURE.md)
- [Agent design](./AGENTS.md)
- [Database design](./DATABASE.md)
- [API specification](./API.md)
- [UI design](./DESIGN.md)
- [Implementation plan](./IMPLEMENTATION_PLAN.md)
