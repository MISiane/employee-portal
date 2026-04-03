import api from './config';

// Get all employees with filters
export const getEmployees = async (params = {}) => {
  try {
    const response = await api.get('/employees', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// Get single employee by ID
export const getEmployeeById = async (id) => {
  try {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
};

// Create new employee
export const createEmployee = async (employeeData) => {
  try {
    const response = await api.post('/employees', employeeData);
    return response.data;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

// Update employee
export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

// Delete employee (soft delete)
export const deleteEmployee = async (id) => {
  try {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Get all departments
export const getDepartments = async () => {
  try {
    const response = await api.get('/employees/departments');
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

// Get upcoming birthdays
export const getUpcomingBirthdays = async () => {
  try {
    const response = await api.get('/employees/upcoming-birthdays');
    return response.data;
  } catch (error) {
    console.error('Error fetching upcoming birthdays:', error);
    throw error;
  }
};

// Reset employee password
export const resetEmployeePassword = async (employeeId) => {
  try {
    const response = await api.post(`/employees/${employeeId}/reset-password`);
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};