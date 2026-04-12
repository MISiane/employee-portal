import api from './config';

// Get all payslips (with filters)
export const getPayslips = async (params) => {
  // Remove any undefined or empty values
  const cleanParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
      cleanParams[key] = params[key];
    }
  });
  const response = await api.get('/payslips', { params: cleanParams });
  return response.data;
};

export const getPayslipById = async (id) => {
  const response = await api.get(`/payslips/${id}`);
  return response.data;
};

export const createPayslip = async (data) => {
  const response = await api.post('/payslips', data);
  return response.data;
};

export const updatePayslip = async (id, data) => {
  const response = await api.put(`/payslips/${id}`, data);
  return response.data;
};

export const deletePayslip = async (id) => {
  const response = await api.delete(`/payslips/${id}`);
  return response.data;
};

export const getPayPeriods = async () => {
  const response = await api.get('/payslips/periods');
  return response.data;
};

// Add download function
export const downloadPayslip = async (id) => {
  try {
    const response = await api.get(`/payslips/${id}/download`, {
      responseType: 'blob'
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header or create one
    const contentDisposition = response.headers['content-disposition'];
    let filename = `payslip_${id}.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) filename = match[1];
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading payslip:', error);
    throw error;
  }
};

// Bulk upload payslips
export const bulkUploadPayslips = async (formData) => {
  const response = await api.post('/payslips/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Get draft payslips (pending review)
export const getDraftPayslips = async (params) => {
  const response = await api.get('/payslips/draft', { params });
  return response.data;
};

// Approve a single payslip
export const approvePayslip = async (id) => {
  const response = await api.post(`/payslips/${id}/approve`);
  return response.data;
};

// Approve all draft payslips
export const approveAllPayslips = async () => {
  const response = await api.post('/payslips/approve-all');
  return response.data;
};

// Reject a payslip
export const rejectPayslip = async (id, rejection_reason) => {
  const response = await api.post(`/payslips/${id}/reject`, { rejection_reason });
  return response.data;
};