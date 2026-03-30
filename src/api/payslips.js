import api from './config';

export const getPayslips = async (params = {}) => {
  const response = await api.get('/payslips', { params });
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