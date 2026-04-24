import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  CakeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import api from '../api/config';

const EmployeeDirectory = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterUpcomingBirthdays, setFilterUpcomingBirthdays] = useState(false);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employees/directory');
      setEmployees(response.data);
      // Calculate upcoming birthdays after employees are loaded
      const upcoming = getUpcomingBirthdays(response.data);
      setUpcomingBirthdays(upcoming);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate upcoming birthdays (next 30 days)
const getUpcomingBirthdays = (employeesList) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // First, calculate the next birthday date for each employee
  const birthdaysWithDates = employeesList.map(emp => {
    if (!emp.date_of_birth) return null;
    
    const birthDate = new Date(emp.date_of_birth);
    // Get birthday this year
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    // If birthday already passed this year, use next year
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
    }
    
    const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    
    return {
      ...emp,
      nextBirthday,
      daysUntil
    };
  }).filter(emp => emp && emp.daysUntil <= 30); // Only keep those within 30 days
  
  // Sort by days until birthday (closest first)
  return birthdaysWithDates.sort((a, b) => a.daysUntil - b.daysUntil);
};

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/employees/departments');
      let depts = response.data;
      if (depts.length > 0 && typeof depts[0] === 'object') {
        setDepartments(depts.map(d => d.name).filter(Boolean));
      } else {
        setDepartments(depts);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const getSortedEmployees = () => {
    let filtered = employees.filter(emp => {
      const matchesSearch = searchTerm === '' || 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = departmentFilter === '' || emp.department === departmentFilter;
      const matchesBirthday = !filterUpcomingBirthdays || upcomingBirthdays.some(b => b.id === emp.id);
      return matchesSearch && matchesDept && matchesBirthday;
    });

    switch(sortBy) {
      case 'name':
        return [...filtered].sort((a,b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
      case 'department':
        return [...filtered].sort((a,b) => (a.department || '').localeCompare(b.department || ''));
      case 'years':
        return [...filtered].sort((a,b) => (b.yearsAtCompany || 0) - (a.yearsAtCompany || 0));
      default:
        return filtered;
    }
  };

  const formatBirthday = (dateOfBirth) => {
    if (!dateOfBirth) return 'Not set';
    const date = new Date(dateOfBirth);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleFilterBirthdays = () => {
    setFilterUpcomingBirthdays(!filterUpcomingBirthdays);
    setDepartmentFilter('');
    setSearchTerm('');
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      'IT': '💻',
      'HR': '🤝',
      'Sales': '📈',
      'Marketing': '📢',
      'Finance': '💰',
      'Operations': '⚙️',
      'Admin': '📋',
      'Frontoffice': '🏨',
      'Default': '👥'
    };
    return icons[department] || icons.Default;
  };

  const filteredEmployees = getSortedEmployees();

  // Stats
  const stats = {
    total: employees.length,
    departments: departments.length,
    upcomingBirthdays: upcomingBirthdays.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserGroupIcon className="h-7 w-7 text-purple-600" />
          Meet the Team!
        </h1>
        <p className="mt-1 text-gray-600">Get to know your colleagues</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
        <div 
          onClick={() => {
            setFilterUpcomingBirthdays(false);
            setDepartmentFilter('');
            setSearchTerm('');
          }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center hover:scale-105 transition cursor-pointer"
        >
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-600">Members</p>
        </div>
      </div>

      {/* Upcoming Birthdays List */}
      {upcomingBirthdays.length > 0 && !filterUpcomingBirthdays && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
          <div className="flex items-center gap-2 mb-3">
            <CakeIcon className="h-5 w-5 text-pink-500" />
            <h3 className="font-semibold text-gray-800">Upcoming Birthdays</h3>
            <span className="text-xs text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">{upcomingBirthdays.length}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {upcomingBirthdays.slice(0, 5).map(emp => (
              <div key={emp.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition">
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{emp.first_name?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-gray-500">{formatBirthday(emp.date_of_birth)}</p>
                </div>
              </div>
            ))}
            {upcomingBirthdays.length > 5 && (
              <button 
                onClick={handleFilterBirthdays}
                className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
              >
                View all {upcomingBirthdays.length} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 focus:border-purple-500 focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.map((dept, index) => (
            <option key={index} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 focus:border-purple-500 focus:outline-none"
        >
          <option value="name">Sort by Name</option>
          <option value="department">Sort by Department</option>
          <option value="years">Sort by Experience</option>
        </select>
      </div>

      {/* Filter Active Badge */}
      {filterUpcomingBirthdays && (
        <div className="flex items-center justify-between bg-pink-50 rounded-lg px-3 py-2">
          <span className="text-sm text-pink-700">Showing employees with upcoming birthdays</span>
          <button onClick={() => setFilterUpcomingBirthdays(false)} className="text-pink-600 hover:text-pink-800 text-sm">
            Clear filter →
          </button>
        </div>
      )}

      {/* Employee Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  {emp.avatar_url ? (
                    <img 
                      src={emp.avatar_url} 
                      alt={`${emp.first_name} ${emp.last_name}`}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-purple-200 group-hover:ring-purple-400 transition"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-200 group-hover:ring-purple-400 transition">
                      <span className="text-lg font-bold text-white">
                        {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{emp.position || 'Team Member'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      <span>{getDepartmentIcon(emp.department)}</span>
                      {emp.department || 'General'}
                    </span>
                    {emp.years_at_company && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        🏆 {emp.years_at_company}y
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Show birthday indicator if upcoming */}
              {upcomingBirthdays.some(b => b.id === emp.id) && (
                <div className="mt-2 text-xs text-pink-600 flex items-center gap-1">
                  <CakeIcon className="h-3 w-3" />
                  Birthday {formatBirthday(emp.date_of_birth)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
              {selectedEmployee.avatar_url ? (
                <img src={selectedEmployee.avatar_url} className="h-24 w-24 rounded-full mx-auto ring-4 ring-white object-cover" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mx-auto ring-4 ring-white">
                  <span className="text-3xl font-bold text-white">
                    {selectedEmployee.first_name?.charAt(0)}{selectedEmployee.last_name?.charAt(0)}
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold mt-3">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
              <p className="text-white/90">{selectedEmployee.position}</p>
              <p className="text-white/80 text-sm mt-1">{selectedEmployee.department}</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Employee Code</span>
                <span className="font-medium">{selectedEmployee.employee_code}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Years with Company</span>
                <span className="font-medium">{selectedEmployee.years_at_company || 'N/A'} years</span>
              </div>
              {selectedEmployee.date_of_birth && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Birthday</span>
                  <span className="font-medium">{formatBirthday(selectedEmployee.date_of_birth)}</span>
                </div>
              )}
              {upcomingBirthdays.some(b => b.id === selectedEmployee.id) && (
                <div className="bg-pink-50 rounded-lg p-3 text-center">
                  <p className="text-pink-600 font-medium">
                    🎂 Birthday coming up soon!
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setSelectedEmployee(null)} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;