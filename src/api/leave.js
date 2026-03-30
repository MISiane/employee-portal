import api from './config';

export const getLeaveBalances = async (year) => {
  const params = year ? { year } : {};
  const response = await api.get('/leave/balances', { params });
  return response.data;
};

export const getMyLeaveRequests = async (params = {}) => {
  const response = await api.get('/leave/requests', { params });
  return response.data;
};

export const createLeaveRequest = async (data) => {
  const response = await api.post('/leave/requests', data);
  return response.data;
};