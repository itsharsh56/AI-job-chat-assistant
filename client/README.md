# AI Job Chat Assistant Client

This directory contains the React frontend for the AI Job Chat Assistant.

## Requirements

- Node.js 18 or later.
- npm.
- A running backend API.

## Install

From this directory:

```bash
npm install
```

## Development

```bash
npm start
```

The development server runs at:

```text
http://localhost:3000
```

## Backend URL

The client uses the following environment variable when provided:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

For production, set this to the deployed backend URL:

```env
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api
```

If the variable is omitted, the development default is
`http://localhost:5000/api`.

## Available Commands

Run tests:

```bash
npm test -- --watchAll=false --runInBand
```

Create a production build:

```bash
npm run build
```

## Frontend Responsibilities

- Upload PDF/DOC/DOCX resumes.
- Display extracted profile details.
- Send chat messages and recent conversation history.
- Render job recommendations and match reasons.
- Record applications through job cards.
- Display application history and statuses.
- Show loading, empty, validation, and error states.
