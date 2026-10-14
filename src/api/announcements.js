import api from './config';

export const getAnnouncements = async (params = {}) => {
  const response = await api.get('/announcements', { params });
  return response.data;
};

export const getLatestAnnouncements = async (limit = 3) => {
  const response = await api.get('/announcements/latest', { params: { limit } });
  return response.data;
};

export const getAnnouncementById = async (id) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
};

// ===== Create announcement with optional attachment =====
export const createAnnouncement = async (data) => {
  // If there's a file, use FormData; otherwise, use regular JSON
  if (data.attachment) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.expires_at) formData.append('expires_at', data.expires_at);
    formData.append('attachment', data.attachment);

    const response = await api.post('/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // No attachment → regular JSON
  const response = await api.post('/announcements', {
    title: data.title,
    content: data.content,
    expires_at: data.expires_at
  });
  return response.data;
};

// ===== Update announcement with optional attachment =====
export const updateAnnouncement = async (id, data) => {
  // If there's a new file OR we're removing the attachment, use FormData
  if (data.attachment || data.remove_attachment) {
    const formData = new FormData();
    
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', data.content);
    if (data.expires_at !== undefined) formData.append('expires_at', data.expires_at || '');
    if (data.is_active !== undefined) formData.append('is_active', data.is_active);
    
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }
    
    if (data.remove_attachment) {
      formData.append('remove_attachment', 'true');
    }

    const response = await api.put(`/announcements/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // No attachment changes → regular JSON
  const response = await api.put(`/announcements/${id}`, data);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};