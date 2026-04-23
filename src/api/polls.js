import api from './config';

// Get poll for announcement
export const getPollByAnnouncement = async (announcementId) => {
  const response = await api.get(`/polls/announcement/${announcementId}`);
  return response.data;
};

// Create poll (admin only)
export const createPoll = async (announcementId, pollData) => {
  const response = await api.post(`/polls/announcement/${announcementId}`, pollData);
  return response.data;
};

// Vote on poll
export const votePoll = async (pollId, optionId) => {
  const response = await api.post(`/polls/${pollId}/vote`, { optionId });
  return response.data;
};

// Delete poll
export const deletePoll = async (pollId) => {
  const response = await api.delete(`/polls/${pollId}`);
  return response.data;
};

// Get poll voters (admin only) - ADD THIS
export const getPollVoters = async (pollId) => {
  const response = await api.get(`/polls/${pollId}/voters`);
  return response.data;
};

// Update poll
export const updatePoll = async (pollId, pollData) => {
  const response = await api.put(`/polls/${pollId}`, pollData);
  return response.data;
};