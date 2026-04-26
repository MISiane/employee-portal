import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  CakeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import api from "../api/config";

const HighFiveButton = ({ employeeId, employeeName, onHighFiveSuccess }) => {
  const [hasHighFived, setHasHighFived] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkHighFive = async () => {
      try {
        const response = await api.get(
          `/employees/${employeeId}/has-high-fived`,
        );
        setHasHighFived(response.data.hasHighFived);
      } catch (error) {
        console.error("Error checking props:", error);
      }
    };
    if (user && employeeId) {
      checkHighFive();
    }
  }, [employeeId, user]);

  const handleHighFive = async () => {
    if (hasHighFived || loading) return;

    setLoading(true);
    try {
      const response = await api.post(`/employees/${employeeId}/high-five`);
      setHasHighFived(true);
      if (onHighFiveSuccess) {
        onHighFiveSuccess(response.data.high_five_count);
      }
    } catch (error) {
      console.error("Error giving props:", error);
      alert(
        error.response?.data?.error ||
          "Failed to send props. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleHighFive}
      disabled={hasHighFived || loading}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition ${
        hasHighFived
          ? "bg-green-500/30 text-white cursor-default"
          : "bg-white/20 text-white hover:bg-white/30 active:scale-95"
      }`}
      title={
        hasHighFived
          ? `Already high-fived ${employeeName}`
          : `High-five ${employeeName}`
      }
    >
      {loading ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
      ) : hasHighFived ? (
        <>
          <span>👏</span>
          <span>sent!</span>
        </>
      ) : (
        <>
          <span>Send a</span>
          <span>👏</span>
        </>
      )}
    </button>
  );
};

// Leaderboard Modal Component
const LeaderboardModal = ({ isOpen, onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employees/leaderboard/high-fives');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate position-based ranking with tenure tie-breaker
  const getRankedLeaderboard = () => {
    // Sort by high-five count DESC, then by hire date ASC (older first)
    const sorted = [...leaderboard].sort((a, b) => {
      if ((a.high_five_count || 0) !== (b.high_five_count || 0)) {
        return (b.high_five_count || 0) - (a.high_five_count || 0);
      }
      // Tie-breaker: older hire date gets higher rank
      return new Date(a.hire_date) - new Date(b.hire_date);
    });
    
    // Add rank and medal to each item
    return sorted.map((person, index) => {
      const position = index + 1;
      let medal = null;
      let medalIcon = null;
      
      if (position === 1) {
        medal = 1;
        medalIcon = '👑';
      } else if (position === 2) {
        medal = 2;
        medalIcon = '🥈';
      } else if (position === 3) {
        medal = 3;
        medalIcon = '🥉';
      }
      
      return {
        ...person,
        rank: position,
        medal,
        medalIcon
      };
    });
  };

  if (!isOpen) return null;

  const rankedLeaderboard = getRankedLeaderboard();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h3 className="text-xl font-bold">Leaderboard</h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">
              ×
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">
            Top Props Receivers {rankedLeaderboard.length > 0 ? `(${rankedLeaderboard.length} total)` : ''}
          </p>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : rankedLeaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">✋</span>
              <p>No props given yet</p>
              <p className="text-sm mt-1">Be the first to give a props to a colleague!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankedLeaderboard.map((person) => {
                const medalBg = person.medal === 1 ? 'from-yellow-400 to-amber-500' 
                              : person.medal === 2 ? 'from-gray-300 to-gray-400' 
                              : person.medal === 3 ? 'from-amber-600 to-orange-500' 
                              : 'from-gray-100 to-gray-100';
                
                return (
                  <div 
                    key={person.id} 
                    className={`flex items-center justify-between p-3 rounded-xl transition ${
                      person.medal ? 'bg-gradient-to-r ' + medalBg + ' bg-opacity-10' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center">
                        {person.medalIcon ? (
                          <span className="text-2xl">{person.medalIcon}</span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-400">#{person.rank}</span>
                        )}
                      </div>
                      {person.avatar_url ? (
                        <img src={person.avatar_url} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${medalBg} flex items-center justify-center`}>
                          <span className="text-sm font-bold text-gray-700">
                            {person.first_name?.charAt(0)}{person.last_name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{person.first_name} {person.last_name}</p>
                        <p className="text-xs text-gray-500">{person.department} • {person.position}</p>
                        {person.hire_date && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            📅 Joined {new Date(person.hire_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/50 rounded-full px-3 py-1">
                      <span className="text-purple-500">✋</span>
                      <span className="font-bold text-gray-700">{person.high_five_count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-center text-gray-500">
            ✨ Each props is unique. You can only give someone once!<br />
            {rankedLeaderboard.length > 0 && rankedLeaderboard[0]?.high_five_count === rankedLeaderboard[1]?.high_five_count && (
              <span className="text-purple-500">🏆 Ties broken by hire date (tenure)</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const EmployeeDirectory = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departments, setDepartments] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterUpcomingBirthdays, setFilterUpcomingBirthdays] = useState(false);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState([]);
  const [filterUpcomingAnniversaries, setFilterUpcomingAnniversaries] =
    useState(false);
    const [todayBirthdaysList, setTodayBirthdaysList] = useState([]);
const [todayAnniversariesList, setTodayAnniversariesList] = useState([]);
  const [highFiveLoading, setHighFiveLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

const fetchEmployees = async () => {
  setLoading(true);
  try {
    const response = await api.get('/employees/directory');
    setEmployees(response.data);
    
    // Calculate upcoming (future) celebrations
    const upcoming = getUpcomingBirthdays(response.data);
    const anniversaries = getUpcomingAnniversaries(response.data);
    setUpcomingBirthdays(upcoming);
    setUpcomingAnniversaries(anniversaries);
    
    // Calculate today's anniversaries from employee data
    const todayAnnivs = getTodayAnniversariesFromData(response.data);
    setTodayAnniversariesList(todayAnnivs);
    
    // Fetch today's birthdays from API
    fetchTodayBirthdays();
    
  } catch (error) {
    console.error('Error fetching employees:', error);
  } finally {
    setLoading(false);
  }
};

  // Fetch today's birthdays from backend
const fetchTodayBirthdays = async () => {
  try {
    const response = await api.get('/employees/today-birthdays');
    if (response.data.success) {
      setTodayBirthdaysList(response.data.birthdays);
    }
  } catch (error) {
    console.error('Error fetching today\'s birthdays:', error);
  }
};

// Calculate today's anniversaries from existing employee data
const getTodayAnniversariesFromData = (employeesList) => {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  
  return employeesList.filter(emp => {
    if (!emp.hire_date) return false;
    const hireDate = new Date(emp.hire_date);
    const yearsAtCompany = today.getFullYear() - hireDate.getFullYear();
    return hireDate.getMonth() === todayMonth && 
           hireDate.getDate() === todayDate && 
           yearsAtCompany >= 1;
  }).map(emp => {
    const hireDate = new Date(emp.hire_date);
    const yearsAtCompany = today.getFullYear() - hireDate.getFullYear();
    return {
      ...emp,
      yearsAtAnniversary: yearsAtCompany,
      daysUntil: 0
    };
  });
};

  // Calculate upcoming birthdays (next 30 days)
  const getUpcomingBirthdays = (employeesList) => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // First, calculate the next birthday date for each employee
    const birthdaysWithDates = employeesList
      .map((emp) => {
        if (!emp.date_of_birth) return null;

        const birthDate = new Date(emp.date_of_birth);
        // Get birthday this year
        let nextBirthday = new Date(
          currentYear,
          birthDate.getMonth(),
          birthDate.getDate(),
        );

        // If birthday already passed this year, use next year
        if (nextBirthday < today) {
          nextBirthday = new Date(
            currentYear + 1,
            birthDate.getMonth(),
            birthDate.getDate(),
          );
        }

        const daysUntil = Math.ceil(
          (nextBirthday - today) / (1000 * 60 * 60 * 24),
        );

        return {
          ...emp,
          nextBirthday,
          daysUntil,
        };
      })
      .filter((emp) => emp && emp.daysUntil <= 30); // Only keep those within 30 days

    // Sort by days until birthday (closest first)
    return birthdaysWithDates.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  // Calculate upcoming work anniversaries (next 30 days)
  const getUpcomingAnniversaries = (employeesList) => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const anniversariesWithDates = employeesList
      .map((emp) => {
        if (!emp.hire_date) return null;

        const hireDate = new Date(emp.hire_date);
        // Get anniversary this year
        let nextAnniversary = new Date(
          currentYear,
          hireDate.getMonth(),
          hireDate.getDate(),
        );

        // If anniversary already passed this year, use next year
        if (nextAnniversary < today) {
          nextAnniversary = new Date(
            currentYear + 1,
            hireDate.getMonth(),
            hireDate.getDate(),
          );
        }

        const daysUntil = Math.ceil(
          (nextAnniversary - today) / (1000 * 60 * 60 * 24),
        );
        const yearsAtAnniversary =
          currentYear -
          hireDate.getFullYear() +
          (nextAnniversary > today ? 0 : 1);

        return {
          ...emp,
          nextAnniversary,
          daysUntil,
          yearsAtAnniversary,
        };
      })
      .filter((emp) => emp && emp.daysUntil <= 30); // Only keep those within 30 days

    // Sort by days until anniversary (closest first)
    return anniversariesWithDates.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/employees/departments");
      let depts = response.data;
      if (depts.length > 0 && typeof depts[0] === "object") {
        setDepartments(depts.map((d) => d.name).filter(Boolean));
      } else {
        setDepartments(depts);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const getSortedEmployees = () => {
    let filtered = employees.filter((emp) => {
      const matchesSearch =
        searchTerm === "" ||
        `${emp.first_name} ${emp.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        departmentFilter === "" || emp.department === departmentFilter;
      const matchesBirthday =
        !filterUpcomingBirthdays ||
        upcomingBirthdays.some((b) => b.id === emp.id);
      const matchesAnniversary =
        !filterUpcomingAnniversaries ||
        upcomingAnniversaries.some((a) => a.id === emp.id);
      return (
        matchesSearch && matchesDept && matchesBirthday && matchesAnniversary
      );
    });

    switch (sortBy) {
      case "name":
        return [...filtered].sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`,
          ),
        );
      case "department":
        return [...filtered].sort((a, b) =>
          (a.department || "").localeCompare(b.department || ""),
        );
      case "years":
        // Sort by total months for accuracy
        return [...filtered].sort((a, b) => {
          const aMonths =
            (a.years_at_company || 0) * 12 + (a.months_at_company || 0);
          const bMonths =
            (b.years_at_company || 0) * 12 + (b.months_at_company || 0);
          return bMonths - aMonths;
        });
      default:
        return filtered;
    }
  };

  const formatBirthday = (dateOfBirth) => {
    if (!dateOfBirth) return "Not set";
    const date = new Date(dateOfBirth);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleFilterBirthdays = () => {
    setFilterUpcomingBirthdays(!filterUpcomingBirthdays);
    setDepartmentFilter("");
    setSearchTerm("");
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      IT: "💻",
      HR: "🤝",
      Sales: "📈",
      Marketing: "📢",
      Finance: "💰",
      Operations: "⚙️",
      Admin: "📋",
      Frontoffice: "🏨",
      Default: "👥",
    };
    return icons[department] || icons.Default;
  };

  const filteredEmployees = getSortedEmployees();

  const stats = {
    total: employees.length,
    departments: departments.length,
    upcomingBirthdays: upcomingBirthdays.length,
    upcomingAnniversaries: upcomingAnniversaries.length,
  };

  // Get rank badge based on tenure (professional but fun)
  const getTenureRank = (years, months) => {
    const totalMonths = (years || 0) * 12 + (months || 0);

    if (totalMonths >= 120) {
      // 10+ years
      return {
        title: "Cornerstone",
        emoji: "💎",
        color: "from-yellow-400 to-amber-600",
        bgColor: "bg-gradient-to-r from-yellow-100 to-amber-100",
        textColor: "text-amber-700",
        description: "A founding pillar of our company",
      };
    } else if (totalMonths >= 60) {
      // 5-9 years
      return {
        title: "Pillar",
        emoji: "🏛️",
        color: "from-purple-400 to-indigo-600",
        bgColor: "bg-gradient-to-r from-purple-100 to-indigo-100",
        textColor: "text-indigo-700",
        description: "Essential to our foundation",
      };
    } else if (totalMonths >= 36) {
      // 3-4 years
      return {
        title: "Veteran",
        emoji: "🚀",
        color: "from-blue-400 to-cyan-600",
        bgColor: "bg-gradient-to-r from-blue-100 to-cyan-100",
        textColor: "text-cyan-700",
        description: "Paving the way forward",
      };
    } else if (totalMonths >= 12) {
      // 1-2 years
      return {
        title: "Expert",
        emoji: "⭐",
        color: "from-green-400 to-emerald-600",
        bgColor: "bg-gradient-to-r from-green-100 to-emerald-100",
        textColor: "text-emerald-700",
        description: "Making a real difference",
      };
    } else if (totalMonths >= 6) {
      // 6-11 months
      return {
        title: "Rising Star",
        emoji: "📈",
        color: "from-teal-400 to-green-500",
        bgColor: "bg-gradient-to-r from-teal-100 to-green-100",
        textColor: "text-teal-700",
        description: "Building momentum",
      };
    } else if (totalMonths >= 3) {
      // 3-5 months
      return {
        title: "Rookie",
        emoji: "⚡",
        color: "from-orange-400 to-yellow-500",
        bgColor: "bg-gradient-to-r from-orange-100 to-yellow-100",
        textColor: "text-orange-700",
        description: "Hitting the ground running",
      };
    } else {
      // Less than 3 months
      return {
        title: "Newbie",
        emoji: "🌱",
        color: "from-gray-400 to-gray-500",
        bgColor: "bg-gradient-to-r from-gray-100 to-gray-100",
        textColor: "text-gray-600",
        description: "Getting settled in",
      };
    }
  };

// Check if employee is in top 3 high-fives (position-based, with tenure tie-breaker)
const getTop3Rank = (employeeId) => {
  if (!employees.length) return null;
  
  // Sort by high-five count DESC, then by hire date ASC (older employees first)
  const sorted = [...employees].sort((a, b) => {
    // First by high-five count
    if ((a.high_five_count || 0) !== (b.high_five_count || 0)) {
      return (b.high_five_count || 0) - (a.high_five_count || 0);
    }
    // Tie-breaker: older hire date gets higher rank (ASC)
    return new Date(a.hire_date) - new Date(b.hire_date);
  });
  
  // Find position (1-indexed)
  const position = sorted.findIndex(emp => emp.id === employeeId) + 1;
  
  // Only top 3 positions get medals
  if (position === 1) {
    return { rank: 1, icon: '👑', color: 'text-yellow-500', label: 'High-Five Champion!' };
  } else if (position === 2) {
    return { rank: 2, icon: '🥈', color: 'text-gray-400', label: '2nd Place' };
  } else if (position === 3) {
    return { rank: 3, icon: '🥉', color: 'text-amber-600', label: '3rd Place' };
  }
  
  return null;
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
            setDepartmentFilter("");
            setSearchTerm("");
          }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center hover:scale-105 transition cursor-pointer"
        >
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-600">Members</p>
        </div>
      </div>

{/* TODAY'S CELEBRATIONS SECTION */}
{(todayBirthdaysList.length > 0 || todayAnniversariesList.length > 0) && (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-md">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xl">🎉</span>
      <h3 className="font-semibold text-gray-800">Today's Celebrations!</h3>
      <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
        Happening Now
      </span>
    </div>

    <div className="space-y-3">
      {/* Today's Birthdays */}
      {todayBirthdaysList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CakeIcon className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium text-gray-700">
              Birthdays 🎂
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayBirthdaysList.map((emp) => (
              <div
                key={`today-bday-${emp.id}`}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition cursor-pointer border-l-4 border-pink-400"
                onClick={() => {
                  const fullEmp = employees.find(e => e.id === emp.id);
                  if (fullEmp) setSelectedEmployee(fullEmp);
                }}
              >
                {emp.avatar_url ? (
                  <img
                    src={emp.avatar_url}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {emp.first_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    🎉 Celebrating today! Wish them well 🎉
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Anniversaries */}
      {todayAnniversariesList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Work Anniversaries 🏆
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayAnniversariesList.map((emp) => {
              const rank = getTenureRank(
                emp.years_at_company,
                emp.months_at_company,
              );
              return (
                <div
                  key={`today-anniv-${emp.id}`}
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition cursor-pointer border-l-4 border-blue-400"
                  onClick={() => setSelectedEmployee(emp)}
                >
                  {emp.avatar_url ? (
                    <img
                      src={emp.avatar_url}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {emp.first_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      🏆 {emp.yearsAtAnniversary} year{emp.yearsAtAnniversary !== 1 ? 's' : ''}! {rank.emoji}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </div>
)}

{/* Upcoming Celebrations - Birthdays & Anniversaries */}
{(upcomingBirthdays.length > 0 || upcomingAnniversaries.length > 0) &&
  !filterUpcomingBirthdays &&
  !filterUpcomingAnniversaries && (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold text-gray-800">
          Upcoming Celebrations 🎉
        </h3>
        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
          {upcomingBirthdays.length + upcomingAnniversaries.length}
        </span>
      </div>

      <div className="space-y-3">
        {/* Birthdays Section */}
        {upcomingBirthdays.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CakeIcon className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium text-gray-700">
                Birthdays
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingBirthdays.slice(0, 3).map((emp) => (
                <div
                  key={`bday-${emp.id}`}
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedEmployee(emp)}
                >
                  {emp.avatar_url ? (
                    <img
                      src={emp.avatar_url}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {emp.first_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBirthday(emp.date_of_birth)} •{" "}
                      {emp.daysUntil} day{emp.daysUntil !== 1 ? "s" : ""}{" "}
                      away
                    </p>
                  </div>
                </div>
              ))}
              {upcomingBirthdays.length > 3 && (
                <button
                  onClick={() => setFilterUpcomingBirthdays(true)}
                  className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1 px-3"
                >
                  +{upcomingBirthdays.length - 3} more birthdays →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Anniversaries Section */}
        {upcomingAnniversaries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Work Anniversaries
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingAnniversaries.slice(0, 3).map((emp) => {
                const rank = getTenureRank(
                  emp.years_at_company,
                  emp.months_at_company,
                );
                const yearText =
                  emp.yearsAtAnniversary === 1
                    ? "1 year"
                    : `${emp.yearsAtAnniversary} years`;
                return (
                  <div
                    key={`anniv-${emp.id}`}
                    className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    {emp.avatar_url ? (
                      <img
                        src={emp.avatar_url}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {emp.first_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        🏆 {yearText} • {rank.title} • {emp.daysUntil} day
                        {emp.daysUntil !== 1 ? "s" : ""} away
                      </p>
                    </div>
                  </div>
                );
              })}
              {upcomingAnniversaries.length > 3 && (
                <button
                  onClick={() => setFilterUpcomingAnniversaries(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3"
                >
                  +{upcomingAnniversaries.length - 3} more anniversaries →
                </button>
              )}
            </div>
          </div>
        )}
        {/* In the celebrations section, at the bottom */}
<div className="text-center mt-2">
  <div className="inline-flex items-center gap-1 text-xs text-purple-400 animate-pulse">
    <span>↓</span>
    <span>scroll for employee list</span>
    <span>↓</span>
  </div>
</div>
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
            <option key={index} value={dept}>
              {dept}
            </option>
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
          <span className="text-sm text-pink-700">
            Showing employees with upcoming birthdays
          </span>
          <button
            onClick={() => setFilterUpcomingBirthdays(false)}
            className="text-pink-600 hover:text-pink-800 text-sm"
          >
            Clear filter →
          </button>
        </div>
      )}
      {filterUpcomingAnniversaries && ( // Add this block
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
          <span className="text-sm text-blue-700">
            🏆 Showing employees with upcoming work anniversaries
          </span>
          <button
            onClick={() => setFilterUpcomingAnniversaries(false)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
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
                        {emp.first_name?.charAt(0)}
                        {emp.last_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  
                  <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition">
                      {getTop3Rank(emp.id) && (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 ${getTop3Rank(emp.id).color}`} title={getTop3Rank(emp.id).label}>
    <span>{getTop3Rank(emp.id).icon}</span>
  </span>
)}
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {emp.position || "Team Member"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      <span>{getDepartmentIcon(emp.department)}</span>
                      {emp.department || "General"}
                    </span>
                  
                    {emp.tenure &&
                      (() => {
                        const rank = getTenureRank(
                          emp.years_at_company,
                          emp.months_at_company,
                        );
                        return (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${rank.bgColor} ${rank.textColor}`}
                            >
                              <span>{rank.emoji}</span>
                              <span>{rank.title}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {emp.tenure}
                            </span>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              </div>

              {/* Show birthday indicator if upcoming */}
              {upcomingBirthdays.some((b) => b.id === emp.id) && (
                <div className="mt-2 text-xs text-pink-600 flex items-center gap-1">
                  <CakeIcon className="h-3 w-3" />
                  Birthday {formatBirthday(emp.date_of_birth)}
                </div>
              )}
              {/* Show anniversary indicator if upcoming */}
              {upcomingAnniversaries.some((a) => a.id === emp.id) && (
                <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                  <BuildingOfficeIcon className="h-3 w-3" />
                  Work anniversary soon!
                  {(() => {
                    const anniv = upcomingAnniversaries.find(
                      (a) => a.id === emp.id,
                    );
                    return (
                      anniv && (
                        <span>
                          {anniv.yearsAtAnniversary} year
                          {anniv.yearsAtAnniversary !== 1 ? "s" : ""} 🏆
                        </span>
                      )
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
              {selectedEmployee.avatar_url ? (
                <img
                  src={selectedEmployee.avatar_url}
                  className="h-24 w-24 rounded-full mx-auto ring-4 ring-white object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mx-auto ring-4 ring-white">
                  <span className="text-3xl font-bold text-white">
                    {selectedEmployee.first_name?.charAt(0)}
                    {selectedEmployee.last_name?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-3">
{(() => {
  const rank = getTop3Rank(selectedEmployee.id);
  if (rank) {
    return (
      <button
        onClick={() => setShowLeaderboard(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-sm hover:bg-white/30 transition cursor-pointer`}
        title={`${rank.label} - Click to view leaderboard`}
      >
        <span>{rank.icon}</span>
      </button>
    );
  }
  return null;
})()}
  <h3 className="text-xl font-bold">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
</div>
<p className="text-white/90">{selectedEmployee.position || 'Team Member'}</p>
<p className="text-white/80 text-sm mt-1">{selectedEmployee.department || 'General'}</p>

              {/* High-five count with inline button */}
              <div className="flex items-center justify-center gap-3 mt-3">
                {/* Props count with clickable leaderboard trigger */}
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-full text-sm hover:bg-white/30 transition cursor-pointer group"
                  title="View leaderboard"
                >
                  <span>👏</span>
                  <span className="font-semibold">
                    {selectedEmployee.high_five_count || 0}
                  </span>
                </button>

                {/* Small high-five button */}
                <HighFiveButton
                  employeeId={selectedEmployee.id}
                  employeeName={selectedEmployee.first_name}
                  onHighFiveSuccess={(newCount) => {
                    setSelectedEmployee((prev) => ({
                      ...prev,
                      high_five_count: newCount,
                    }));
                    setEmployees((prev) =>
                      prev.map((emp) =>
                        emp.id === selectedEmployee.id
                          ? { ...emp, high_five_count: newCount }
                          : emp,
                      ),
                    );
                  }}
                />
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Employee Code</span>
                <span className="font-medium">
                  {selectedEmployee.employee_code || "N/A"}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Time with the Company</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-medium">
                    {selectedEmployee.tenure || "Less than 1 month"}
                  </span>
                  {selectedEmployee.tenure &&
                    (() => {
                      const rank = getTenureRank(
                        selectedEmployee.years_at_company,
                        selectedEmployee.months_at_company,
                      );
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${rank.bgColor} ${rank.textColor}`}
                        >
                          <span>{rank.emoji}</span>
                          <span>{rank.title}</span>
                        </span>
                      );
                    })()}
                </div>
              </div>

              {selectedEmployee.date_of_birth && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Birthday</span>
                  <span className="font-medium">
                    {formatBirthday(selectedEmployee.date_of_birth)}
                  </span>
                </div>
              )}

              {/* Celebration alerts */}
              {upcomingBirthdays.some((b) => b.id === selectedEmployee.id) && (
                <div className="bg-pink-50 rounded-lg p-3 text-center">
                  <p className="text-pink-600 font-medium text-sm">
                    🎂 Birthday coming up soon!
                  </p>
                </div>
              )}

              {upcomingAnniversaries.some(
                (a) => a.id === selectedEmployee.id,
              ) &&
                (() => {
                  const anniv = upcomingAnniversaries.find(
                    (a) => a.id === selectedEmployee.id,
                  );
                  return (
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-blue-600 font-medium text-sm">
                        🏆 Work anniversary soon! {anniv.yearsAtAnniversary}{" "}
                        year{anniv.yearsAtAnniversary !== 1 ? "s" : ""} with us!
                      </p>
                    </div>
                  );
                })()}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        employees={employees}
      />
    </div>
  );
};

export default EmployeeDirectory;
