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

// ----- Supervisor approval -----
export const getSupervisorInfo = async () => {
  const response = await api.get('/leave/supervisor/me');
  return response.data;
};

export const getSupervisorRequests = async (params = {}) => {
  const response = await api.get('/leave/supervisor/requests', { params });
  return response.data;
};

export const decideAsSupervisor = async (id, decision, notes) => {
  const response = await api.put(`/leave/requests/${id}/supervisor`, { decision, notes });
  return response.data;
};
