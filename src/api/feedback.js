import api from './config';

// Submit feedback
export const submitFeedback = async (data) => {
  const response = await api.post('/feedback', data);
  return response.data;
};

// Get user's own feedback
export const getMyFeedback = async (params) => {
  const response = await api.get('/feedback/my', { params });
  return response.data;
};

// Get all feedback (admin only) - Updated URL
export const getAllFeedback = async (params) => {
  const response = await api.get('/feedback/all', { params });
  return response.data;
};

// Update feedback status (admin only) - Updated URL
export const updateFeedbackStatus = async (id, status, resolution_notes) => {
  const response = await api.put(`/feedback/${id}/status`, { status, resolution_notes });
  return response.data;
};

// Get FAQs
export const getFAQs = async () => {
  const response = await api.get('/faqs');
  return response.data;
};

// Create FAQ (admin only) - Updated URL
export const createFAQ = async (data) => {
  const response = await api.post('/faqs', data);
  return response.data;
};

// Update FAQ (admin only) - Updated URL
export const updateFAQ = async (id, data) => {
  const response = await api.put(`/faqs/${id}`, data);
  return response.data;
};

// Delete FAQ (admin only) - Updated URL
export const deleteFAQ = async (id) => {
  const response = await api.delete(`/faqs/${id}`);
  return response.data;
};