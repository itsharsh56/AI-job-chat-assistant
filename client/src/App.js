import React, { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  Upload,
  Send,
  Bot,
  User,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Sparkles,
  Clock,
  Building2,
  FileCheck
} from 'lucide-react';
import { api } from './services/api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [resume, setResume] = useState(null);
  const [applications, setApplications] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text:
        'Welcome! I am your AI Job Assistant. Upload your resume to match with 1,500+ real job listings, or type a request below to get started.',
      intent: 'WELCOME'
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (
      typeof messagesEndRef.current?.scrollIntoView ===
      'function'
    ) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages, loadingChat]);

  useEffect(() => {
    fetchLatestResume();
    fetchApplications();
  }, []);

  const fetchLatestResume = async () => {
    try {
      const response = await api.getLatestResume();

      if (response.success) {
        setResume(response.data);
      }
    } catch (error) {
      // A missing resume is expected for a new user.
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.getApplications();

      if (response.success) {
        setApplications(response.applications || []);
      }
    } catch (error) {
      setErrorMessage(
        'Unable to load your applications. Please try again.'
      );
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage('');
    setUploading(true);

    try {
      const response = await api.uploadResume(file);

      if (!response.success) {
        setErrorMessage(
          response.message || 'Unable to upload the resume.'
        );
        return;
      }

      const uploadedResume = response.data;

      setResume(uploadedResume);

      const extractedSkills = uploadedResume.skills || [];

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          sender: 'assistant',
          text:
            `Successfully uploaded ${file.name}. ` +
            `Extracted ${extractedSkills.length} skill(s). ` +
            'Ask me to recommend jobs for your profile.',
          intent: 'RESUME_UPLOADED'
        }
      ]);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to upload the resume.';

      setErrorMessage(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;

    if (!textToSend.trim() || loadingChat) {
      return;
    }

    setErrorMessage('');

    const userMessage = {
      sender: 'user',
      text: textToSend
    };

    const history = messages.map((message) => ({
      role: message.sender,
      content: message.text
    }));

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage
    ]);

    if (!customText) {
      setInputMessage('');
    }

    setLoadingChat(true);

    try {
      const response = await api.sendMessage(
        textToSend,
        history
      );

      if (!response.success) {
        setErrorMessage(
          response.message || 'Unable to process your message.'
        );
        return;
      }

      const assistantResponse = response.data;

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          sender: 'assistant',
          text: assistantResponse.reply,
          intent: assistantResponse.intent,
          data: assistantResponse.data
        }
      ]);

      if (
        assistantResponse.intent === 'APPLY_JOB_SUCCESS' ||
        assistantResponse.intent === 'APPLY_JOB_EXISTS'
      ) {
        await fetchApplications();
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to process your request. Please try again.';

      setErrorMessage(message);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleApply = async (jobId) => {
    setErrorMessage('');

    try {
      const response = await api.applyJob(jobId);

      if (!response.success) {
        setErrorMessage(
          response.message || 'Unable to record the application.'
        );
        return;
      }

      await fetchApplications();

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          sender: 'assistant',
          text: response.message,
          intent: 'APPLY_JOB_SUCCESS'
        }
      ]);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to record the application.';

      setErrorMessage(message);
    }
  };

  const isJobApplied = (jobId) => {
    return applications.some(
      (application) => application.jobId === jobId
    );
  };

  const renderResumeDetails = () => {
    const skills = resume.skills || [];
    const experience = resume.experience || [];
    const education = resume.education || [];
    const projects = resume.projects || [];
    const contactDetails = resume.contactDetails || {};

    return (
      <div className="profile-card">
        <div className="profile-heading">
          <h3>{resume.name || 'Applicant'}</h3>
          <FileCheck size={18} className="success-icon" />
        </div>

        <div className="designation-badge">
          {resume.designation || 'Designation not specified'}
        </div>

        <div className="profile-details">
          {contactDetails.email && (
            <p>
              <strong>Email:</strong> {contactDetails.email}
            </p>
          )}

          {contactDetails.phone && (
            <p>
              <strong>Phone:</strong> {contactDetails.phone}
            </p>
          )}

          {contactDetails.location && (
            <p>
              <strong>Location:</strong>{' '}
              {contactDetails.location}
            </p>
          )}
        </div>

        <section className="resume-section">
          <h5>
            Extracted Skills ({skills.length})
          </h5>

          {skills.length > 0 ? (
            <div>
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="skill-tag"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-detail">
              No skills were extracted.
            </p>
          )}
        </section>

        <section className="resume-section">
          <h5>Experience</h5>

          {experience.length > 0 ? (
            experience.map((item, index) => (
              <div
                key={`experience-${index}`}
                className="resume-item"
              >
                {typeof item === 'string' ? (
                  <p>{item}</p>
                ) : (
                  <>
                    {item.title && <strong>{item.title}</strong>}
                    {item.company && (
                      <p>Company: {item.company}</p>
                    )}
                    {item.duration && (
                      <p>Duration: {item.duration}</p>
                    )}
                    {item.description && (
                      <p>{item.description}</p>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="empty-detail">
              No experience details were extracted.
            </p>
          )}
        </section>

        <section className="resume-section">
          <h5>Education</h5>

          {education.length > 0 ? (
            education.map((item, index) => (
              <div
                key={`education-${index}`}
                className="resume-item"
              >
                {typeof item === 'string' ? (
                  <p>{item}</p>
                ) : (
                  <>
                    {item.degree && <strong>{item.degree}</strong>}
                    {item.institution && (
                      <p>
                        Institution: {item.institution}
                      </p>
                    )}
                    {item.year && (
                      <p>Year: {item.year}</p>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="empty-detail">
              No education details were extracted.
            </p>
          )}
        </section>

        <section className="resume-section">
          <h5>Projects</h5>

          {projects.length > 0 ? (
            projects.map((item, index) => (
              <div
                key={`project-${index}`}
                className="resume-item"
              >
                {typeof item === 'string' ? (
                  <p>{item}</p>
                ) : (
                  <>
                    {item.name && <strong>{item.name}</strong>}
                    {item.description && (
                      <p>{item.description}</p>
                    )}
                    {item.technologies?.length > 0 && (
                      <p>
                        Technologies:{' '}
                        {item.technologies.join(', ')}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="empty-detail">
              No project details were extracted.
            </p>
          )}
        </section>
      </div>
    );
  };

  const renderApplications = () => {
    return (
      <div>
        <h4 className="section-title">
          Tracked Applications ({applications.length})
        </h4>

        {applications.length === 0 ? (
          <p className="empty-detail">
            No applications recorded yet.
          </p>
        ) : (
          <div className="applications-list">
            {applications.map((application) => (
              <div
                key={application._id || application.jobId}
                className="application-card"
              >
                <div className="application-card-header">
                  <strong>{application.jobTitle}</strong>

                  <span className="application-status">
                    {application.status}
                  </span>
                </div>

                <p>
                  {application.company} •{' '}
                  {application.location}
                </p>

                <span className="application-date">
                  <Clock size={12} />
                  {new Date(
                    application.appliedAt
                  ).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderJobCards = (jobs) => {
    return (
      <div className="job-cards-grid">
        {jobs.map((job) => {
          const applied = isJobApplied(job.jobId);

          return (
            <div
              key={job.jobId}
              className="job-card"
            >
              <div className="job-card-header">
                <div>
                  <h4>{job.title}</h4>

                  <p className="job-meta">
                    <Building2 size={14} />
                    {job.company}

                    <MapPin
                      size={14}
                      className="job-location-icon"
                    />

                    {job.location}

                    {job.isRemote && (
                      <span className="remote-label">
                        [Remote]
                      </span>
                    )}
                  </p>
                </div>

                {job.matchScore !== undefined && (
                  <span className="match-score-badge">
                    {job.matchScore}% Match
                  </span>
                )}
              </div>

              {job.matchReasons?.length > 0 && (
                <div className="match-reasons">
                  <Sparkles size={14} />
                  {job.matchReasons.join(' • ')}
                </div>
              )}

              <div className="job-skills">
                {(job.skills || [])
                  .slice(0, 6)
                  .map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="skill-tag"
                    >
                      {skill}
                    </span>
                  ))}
              </div>

              <div className="job-card-actions">
                <a
                  href={job.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  View Source Listing
                  <ExternalLink size={12} />
                </a>

                <button
                  className={`apply-btn ${
                    applied ? 'applied' : ''
                  }`}
                  onClick={() =>
                    !applied && handleApply(job.jobId)
                  }
                  disabled={applied}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 size={14} />
                      Applied
                    </>
                  ) : (
                    'Apply Job'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      {errorMessage && (
        <div
          className="error-message"
          role="alert"
        >
          {errorMessage}

          <button
            type="button"
            className="close-error"
            onClick={() => setErrorMessage('')}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
          <Briefcase
            size={22}
            className="brand-icon"
          />
          <h1>AI Job Assistant</h1>
        </div>

        <div className="tab-nav">
          <button
            className={`tab-btn ${
              activeTab === 'profile' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            Resume &amp; Profile
          </button>

          <button
            className={`tab-btn ${
              activeTab === 'applications' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('applications')}
          >
            <CheckCircle2 size={16} />
            Applications ({applications.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' ? (
            <div>
              <label className="upload-card">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />

                <Upload className="upload-icon" />

                <h4>
                  {uploading
                    ? 'Parsing Document...'
                    : 'Upload Resume'}
                </h4>

                <p>PDF or DOCX (max 10MB)</p>
              </label>

              {resume ? (
                renderResumeDetails()
              ) : (
                <p className="empty-upload-message">
                  Upload your resume to automatically extract
                  profile information and match top jobs.
                </p>
              )}
            </div>
          ) : (
            renderApplications()
          )}
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-title">
            <Bot size={22} className="brand-icon" />

            <div>
              <h2>AI Job Assistant</h2>

              <span className="online-status">
                ● Online | 1,500+ Jobs Dataset
              </span>
            </div>
          </div>
        </header>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={`${message.sender}-${index}`}
              className={`message ${message.sender}`}
            >
              <div className="avatar">
                {message.sender === 'user' ? (
                  <User size={18} />
                ) : (
                  <Bot size={18} />
                )}
              </div>

              <div className="message-content">
                <p>{message.text}</p>

                {message.data?.jobs &&
                  renderJobCards(message.data.jobs)}
              </div>
            </div>
          ))}

          {loadingChat && (
            <div className="message assistant">
              <div className="avatar">
                <Bot size={18} />
              </div>

              <div className="message-content loading-message">
                Searching listings and evaluating requirements...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="quick-chips">
          <button
            className="chip-btn"
            onClick={() =>
              handleSendMessage(
                'Recommend best jobs for my profile'
              )
            }
          >
            Recommend top jobs for my profile
          </button>

          <button
            className="chip-btn"
            onClick={() =>
              handleSendMessage(
                'Show only remote software developer jobs'
              )
            }
          >
            Show remote jobs
          </button>

          <button
            className="chip-btn"
            onClick={() =>
              handleSendMessage(
                'Find jobs requiring React and Node.js'
              )
            }
          >
            React &amp; Node.js jobs
          </button>

          <button
            className="chip-btn"
            onClick={() =>
              handleSendMessage(
                'Show status of my applications'
              )
            }
          >
            Show my applications
          </button>
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask anything: e.g., 'Show remote React jobs' or 'Apply to job remotive-1234'"
            value={inputMessage}
            onChange={(event) =>
              setInputMessage(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />

          <button
            className="send-btn"
            onClick={() => handleSendMessage()}
            disabled={loadingChat}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;