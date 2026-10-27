import { render, screen } from '@testing-library/react';
import App from './App';
import { api } from './services/api';

jest.mock('./services/api', () => ({
  api: {
    getLatestResume: jest.fn(),
    getApplications: jest.fn(),
    uploadResume: jest.fn(),
    sendMessage: jest.fn(),
    applyJob: jest.fn()
  }
}));

beforeEach(() => {
  api.getLatestResume.mockResolvedValue({
    success: false
  });

  api.getApplications.mockResolvedValue({
    success: true,
    applications: []
  });
});

test('renders the AI job assistant interface', async () => {
  render(<App />);

  expect(
    screen.getByText('AI Job Assistant')
  ).toBeInTheDocument();

  expect(
    screen.getByText('Upload Resume')
  ).toBeInTheDocument();

  expect(
    screen.getByPlaceholderText(
      /Show remote React jobs/i
    )
  ).toBeInTheDocument();
});

test('renders the applications tab', () => {
  render(<App />);

  expect(
    screen.getByText(/Applications \(0\)/i)
  ).toBeInTheDocument();
});