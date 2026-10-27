import axios from 'axios';
import { api } from './api';

jest.mock('axios');

test('uploads resumes to the backend resume route without a duplicate slash', async () => {
  const file = new File(['resume'], 'resume.pdf', {
    type: 'application/pdf'
  });

  axios.post.mockResolvedValue({
    data: {
      success: true
    }
  });

  await api.uploadResume(file);

  expect(axios.post).toHaveBeenCalledWith(
    'http://localhost:5000/api/resume/upload',
    expect.any(FormData)
  );
});
