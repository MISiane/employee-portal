export const departments = [
  { 
    name: 'Admin', 
    color: 'bg-purple-100 text-purple-800',
    bgGradient: 'from-purple-50 to-purple-100',
    icon: '👔'
  },
  { 
    name: 'Frontoffice', 
    color: 'bg-blue-100 text-blue-800',
    bgGradient: 'from-blue-50 to-blue-100',
    icon: '🏨'
  },
  { 
    name: 'Food and Beverage', 
    color: 'bg-green-100 text-green-800',
    bgGradient: 'from-green-50 to-green-100',
    icon: '🍽️'
  },
  { 
    name: 'Kitchen', 
    color: 'bg-orange-100 text-orange-800',
    bgGradient: 'from-orange-50 to-orange-100',
    icon: '👨‍🍳'
  },
  { 
    name: 'Bakeshop', 
    color: 'bg-pink-100 text-pink-800',
    bgGradient: 'from-pink-50 to-pink-100',
    icon: '🥐'
  },
  { 
    name: 'Housekeeping', 
    color: 'bg-teal-100 text-teal-800',
    bgGradient: 'from-teal-50 to-teal-100',
    icon: '🧹'
  },
  { 
    name: 'Engineering and Maintenance', 
    color: 'bg-gray-100 text-gray-800',
    bgGradient: 'from-gray-50 to-gray-100',
    icon: '🔧'
  }
];

export const getDepartmentStyle = (departmentName) => {
  const dept = departments.find(d => d.name === departmentName);
  return dept || departments[0];
};