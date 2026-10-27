import axios from 'axios';

const API_BASE = (
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:5000/api'
).replace(/\/+$/, '');

export const api = {
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await axios.post(
      `${API_BASE}/resume/upload`,
      formData
    );

    return response.data;
  },

  getLatestResume: async () => {
    const response = await axios.get(
      `${API_BASE}/resume/latest`
    );

    return response.data;
  },

  getJobs: async (params = {}) => {
    const response = await axios.get(
      `${API_BASE}/jobs`,
      {
        params
      }
    );

    return response.data;
  },

  matchJobs: async (payload = {}) => {
    const response = await axios.post(
      `${API_BASE}/jobs/match`,
      payload
    );

    return response.data;
  },

  sendMessage: async (message, history = []) => {
    const response = await axios.post(
      `${API_BASE}/chat`,
      {
        message,
        history
      }
    );

    return response.data;
  },

  applyJob: async (jobId) => {
    const response = await axios.post(
      `${API_BASE}/applications/apply`,
      {
        jobId
      }
    );

    return response.data;
  },

  getApplications: async () => {
    const response = await axios.get(
      `${API_BASE}/applications`
    );

    return response.data;
  },

  getApplicationStatus: async (jobId) => {
    const response = await axios.get(
      `${API_BASE}/applications/status/${jobId}`
    );

    return response.data;
  }
};