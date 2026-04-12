import api from './config';

// Get notifications
export const getNotifications = async (params) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

// Mark notification as read
export const markAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

// Mark all as read
export const markAllAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

// Delete notification
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

// Get preferences
export const getPreferences = async () => {
  const response = await api.get('/notifications/preferences');
  return response.data;
};

// Update preferences
export const updatePreferences = async (data) => {
  const response = await api.put('/notifications/preferences', data);
  return response.data;
};