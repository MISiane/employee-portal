import api from './config';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Upload profile picture - make sure the URL matches
export const uploadAvatar = async (formData) => {
  const response = await api.post('/upload-avatar', formData, {  // Note: /upload-avatar, not /users/upload-avatar
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Delete profile picture
export const deleteAvatar = async () => {
  const response = await api.delete('/delete-avatar');
  return response.data;
};