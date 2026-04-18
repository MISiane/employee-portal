import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PencilIcon, 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BriefcaseIcon,
  CalendarIcon,
  MapPinIcon,
  BanknotesIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  XMarkIcon,
  CheckIcon,
  KeyIcon,
  IdentificationIcon,
  DocumentTextIcon,
  CakeIcon,
  PhotoIcon,
  CameraIcon,
  CheckCircleIcon,
  PaintBrushIcon,
  SwatchIcon  
} from '@heroicons/react/24/outline';
import { getEmployeeById, updateEmployee } from '../api/employees';
import ChangePasswordModal from '../components/Profile/ChangePasswordModal';

const themes = [
  { 
    name: 'Ocean Blue', 
    value: 'ocean',
    primary: 'from-blue-600 to-blue-700',
    primarySolid: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    accent: 'from-blue-500 to-blue-600',
    accentSolid: 'bg-blue-500',
    button: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-700',
    cardBorder: 'border-blue-100',
    statGradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  { 
    name: 'Sunset Orange', 
    value: 'sunset',
    primary: 'from-orange-600 to-red-700',
    primarySolid: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    accent: 'from-orange-500 to-red-600',
    accentSolid: 'bg-orange-500',
    button: 'bg-orange-600',
    buttonHover: 'hover:bg-orange-700',
    cardBorder: 'border-orange-100',
    statGradient: 'from-orange-500 to-red-600',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  { 
    name: 'Forest Green', 
    value: 'forest',
    primary: 'from-green-700 to-emerald-700',
    primarySolid: 'bg-green-700',
    primaryHover: 'hover:bg-green-800',
    accent: 'from-green-600 to-emerald-600',
    accentSolid: 'bg-green-600',
    button: 'bg-green-600',
    buttonHover: 'hover:bg-green-700',
    cardBorder: 'border-green-100',
    statGradient: 'from-green-600 to-emerald-600',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  { 
    name: 'Royal Purple', 
    value: 'purple',
    primary: 'from-purple-600 to-indigo-700',
    primarySolid: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    accent: 'from-purple-500 to-indigo-600',
    accentSolid: 'bg-purple-500',
    button: 'bg-purple-600',
    buttonHover: 'hover:bg-purple-700',
    cardBorder: 'border-purple-100',
    statGradient: 'from-purple-500 to-indigo-600',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  { 
    name: 'Rose Pink', 
    value: 'rose',
    primary: 'from-rose-600 to-pink-700',
    primarySolid: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    accent: 'from-rose-500 to-pink-600',
    accentSolid: 'bg-rose-500',
    button: 'bg-rose-600',
    buttonHover: 'hover:bg-rose-700',
    cardBorder: 'border-rose-100',
    statGradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600'
  },
  { 
    name: 'Teal Dreams', 
    value: 'teal',
    primary: 'from-teal-600 to-cyan-700',
    primarySolid: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    accent: 'from-teal-500 to-cyan-600',
    accentSolid: 'bg-teal-500',
    button: 'bg-teal-600',
    buttonHover: 'hover:bg-teal-700',
    cardBorder: 'border-teal-100',
    statGradient: 'from-teal-500 to-cyan-600',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600'
  },
  { 
    name: 'Midnight', 
    value: 'midnight',
    primary: 'from-slate-700 to-gray-800',
    primarySolid: 'bg-slate-700',
    primaryHover: 'hover:bg-slate-800',
    accent: 'from-slate-600 to-gray-700',
    accentSolid: 'bg-slate-600',
    button: 'bg-slate-600',
    buttonHover: 'hover:bg-slate-700',
    cardBorder: 'border-slate-100',
    statGradient: 'from-slate-600 to-gray-700',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  },
  { 
    name: 'Amber Glow', 
    value: 'amber',
    primary: 'from-amber-600 to-yellow-700',
    primarySolid: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    accent: 'from-amber-500 to-yellow-600',
    accentSolid: 'bg-amber-500',
    button: 'bg-amber-600',
    buttonHover: 'hover:bg-amber-700',
    cardBorder: 'border-amber-100',
    statGradient: 'from-amber-500 to-yellow-600',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  }
];

// Avatar colors (separate from themes, for the avatar only)
const avatarColors = [
  { name: 'Blue', value: 'blue', gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-500' },
  { name: 'Purple', value: 'purple', gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-500' },
  { name: 'Green', value: 'green', gradient: 'from-green-500 to-green-600', bg: 'bg-green-500' },
  { name: 'Orange', value: 'orange', gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-500' },
  { name: 'Pink', value: 'pink', gradient: 'from-pink-500 to-pink-600', bg: 'bg-pink-500' },
  { name: 'Teal', value: 'teal', gradient: 'from-teal-500 to-teal-600', bg: 'bg-teal-500' },
  { name: 'Red', value: 'red', gradient: 'from-red-500 to-red-600', bg: 'bg-red-500' },
  { name: 'Yellow', value: 'yellow', gradient: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-500' },
];

const InfoField = ({ label, value, icon: Icon, editField, type = 'text', isEditable = true, editing, formData, onInputChange }) => (
  <div className="border-b border-gray-200 pb-3">
    <div className="flex items-center mb-1">
      <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" />
      <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">{label}</span>
    </div>
    {editing && editField && isEditable ? (
      type === 'textarea' ? (
        <textarea
          name={editField}
          value={formData[editField] || ''}
          onChange={onInputChange}
          rows="2"
          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : type === 'date' ? (
        <input
          type="date"
          name={editField}
          value={formData[editField] || ''}
          onChange={onInputChange}
          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <input
          type={type}
          name={editField}
          value={formData[editField] || ''}
          onChange={onInputChange}
          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )
    ) : (
      <p className="text-gray-800 font-medium mt-1 text-sm sm:text-base">{value || 'Not provided'}</p>
    )}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`bg-gradient-to-r ${color} rounded-xl sm:rounded-2xl p-4 sm:p-6`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-white/80 font-medium">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white/80" />
    </div>
  </div>
);

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, missingFields: [] });
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
const [activeTab, setActiveTab] = useState('avatar'); // 'avatar' or 'theme'
  const [avatarColor, setAvatarColor] = useState(() => {
    const savedColor = localStorage.getItem('avatarColor');
    return savedColor || 'blue';
  });
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('profileTheme');
    return savedTheme || 'ocean';
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Get current color object
  const currentColor = avatarColors.find(c => c.value === avatarColor) || avatarColors[0];

  const theme = themes.find(t => t.value === currentTheme) || themes[0];

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      calculateCompletion();
    }
  }, [profile]);

  // Save color preference to localStorage when changed
  useEffect(() => {
    localStorage.setItem('avatarColor', avatarColor);
  }, [avatarColor]);

  // Save theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('profileTheme', currentTheme);
  }, [currentTheme]);

  const fetchProfile = async () => {
    try {
      const data = await getEmployeeById(user.id);
      setProfile(data);
      setFormData({
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
        sss_number: data.sss_number || '',
        philhealth_number: data.philhealth_number || '',
        pagibig_number: data.pagibig_number || '',
        tin_number: data.tin_number || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    const requiredFields = [
      { name: 'Phone Number', value: profile?.phone, weight: 10 },
      { name: 'Address', value: profile?.address, weight: 10 },
      { name: 'City', value: profile?.city, weight: 5 },
      { name: 'Birth Date', value: profile?.date_of_birth, weight: 10 },
      { name: 'Emergency Contact Name', value: profile?.emergency_contact_name, weight: 10 },
      { name: 'Emergency Contact Phone', value: profile?.emergency_contact_phone, weight: 10 },
    ];

    let totalWeight = 0;
    let achievedWeight = 0;
    const missing = [];

    requiredFields.forEach(field => {
      totalWeight += field.weight;
      if (field.value && field.value !== '') {
        achievedWeight += field.weight;
      } else {
        missing.push(field.name);
      }
    });

    const percentage = Math.round((achievedWeight / totalWeight) * 100);
    setCompletion({ percentage, missingFields: missing });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await updateEmployee(user.id, formData);
      setProfile(prev => ({ ...prev, ...response.profile }));
      setEditing(false);
      setEditSection(null);
      setSuccessMessage('Profile updated successfully!');
      
      if (updateUser) {
        updateUser({ ...user, ...response.user });
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Error updating profile. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditSection(null);
    setFormData({
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zip_code: profile?.zip_code || '',
      emergency_contact_name: profile?.emergency_contact_name || '',
      emergency_contact_phone: profile?.emergency_contact_phone || '',
      date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
      sss_number: profile?.sss_number || '',
      philhealth_number: profile?.philhealth_number || '',
      pagibig_number: profile?.pagibig_number || '',
      tin_number: profile?.tin_number || '',
    });
    setErrorMessage('');
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-between text-sm">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700">
            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-between text-sm">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-700">
            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      )}

      {/* Profile Header */}
<div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
  <div className={`bg-gradient-to-r ${theme.primary} h-20 sm:h-32`}></div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-10 sm:-mt-12 mb-4">
          {/* Avatar with Color Picker - Modal Version */}
<div className="relative">
  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white p-1 shadow-lg">
    <div className={`h-full w-full rounded-full bg-gradient-to-r ${currentColor.gradient} flex items-center justify-center`}>
      <span className="text-2xl sm:text-3xl font-bold text-white">
        {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
      </span>
    </div>
  </div>
  
 {/* Single Customization Button */}
  <button
    onClick={() => {
      setActiveTab('avatar'); // Start with avatar tab
      setShowCustomizationModal(true);
    }}
    className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-all hover:scale-110 z-10"
    title="Customize profile"
  >
    <PaintBrushIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
  </button>
</div>

{/* Customization Modal - Avatar Colors + Themes */}
{showCustomizationModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
      {/* Modal Header with Gradient */}
      <div className={`bg-gradient-to-r ${theme.primary} p-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Customize Your Profile</h3>
          <button
            onClick={() => setShowCustomizationModal(false)}
            className="text-white/80 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-white/80 text-xs mt-1">Make your profile look the way you want</p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex-1 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'avatar' 
              ? `text-${theme.accentSolid.split('-')[1]}-600` 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <PaintBrushIcon className="h-4 w-4" />
            Avatar Color
          </div>
          {activeTab === 'avatar' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${theme.accentSolid.split('-')[1]}-500`}></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'theme' 
              ? `text-${theme.accentSolid.split('-')[1]}-600` 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SwatchIcon className="h-4 w-4" />
            Theme Colors
          </div>
          {activeTab === 'theme' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${theme.accentSolid.split('-')[1]}-500`}></div>
          )}
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="p-4 max-h-[50vh] overflow-y-auto">
        {/* Avatar Colors Tab */}
        {activeTab === 'avatar' && (
          <div>
            <div className="text-center mb-4">
              <div className={`h-16 w-16 mx-auto rounded-full bg-gradient-to-r ${avatarColors.find(c => c.value === avatarColor)?.gradient} flex items-center justify-center shadow-lg mb-2`}>
                <span className="text-2xl font-bold text-white">
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Pick a color for your avatar</p>
              <p className="text-xs text-gray-400">This is the circle with your initials</p>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {avatarColors.map(color => (
                <button
                  key={color.value}
                  onClick={() => {
                    setAvatarColor(color.value);
                    setSuccessMessage(`Avatar color changed to ${color.name}! 🎨`);
                    setTimeout(() => setSuccessMessage(''), 2000);
                  }}
                  className={`h-12 w-12 rounded-full ${color.bg} hover:scale-110 transition-transform mx-auto ${
                    avatarColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Current color:</span>
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full ${avatarColors.find(c => c.value === avatarColor)?.bg}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {avatarColors.find(c => c.value === avatarColor)?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Themes Tab */}
        {activeTab === 'theme' && (
          <div>
            <div className="text-center mb-4">
              <div className="flex justify-center gap-2 mb-2">
                <div className={`h-8 w-16 rounded-lg bg-gradient-to-r ${theme.primary}`}></div>
                <div className={`h-8 w-8 rounded ${theme.accentSolid}`}></div>
                <div className={`h-8 w-8 rounded ${theme.button}`}></div>
              </div>
              <p className="text-sm text-gray-600">Choose a color scheme for your profile</p>
              <p className="text-xs text-gray-400">Changes header, buttons, and card colors</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {themes.map(themeOption => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setCurrentTheme(themeOption.value);
                    setSuccessMessage(`Theme changed to ${themeOption.name}! 🎨`);
                    setTimeout(() => setSuccessMessage(''), 2000);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all hover:scale-105 text-left ${
                    currentTheme === themeOption.value 
                      ? 'border-blue-500 ring-2 ring-offset-2 ring-blue-500' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className={`h-10 rounded-lg bg-gradient-to-r ${themeOption.primary}`}></div>
                    <div className="flex gap-1">
                      <div className={`h-3 w-3 rounded ${themeOption.accentSolid}`}></div>
                      <div className={`h-3 w-3 rounded ${themeOption.primarySolid}`}></div>
                      <div className="h-3 w-3 rounded bg-gray-200"></div>
                      <div className="h-3 w-3 rounded bg-gray-200"></div>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{themeOption.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => setShowCustomizationModal(false)}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Close
          </button>
          <button
            onClick={() => {
              setShowCustomizationModal(false);
              setSuccessMessage('Your customization has been saved! 🎉');
              setTimeout(() => setSuccessMessage(''), 2000);
            }}
            className={`flex-1 py-2 ${theme.button} text-white rounded-lg ${theme.buttonHover} transition text-sm`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
)}
            
            <div className="sm:ml-4 mt-3 sm:mt-0 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                {profile?.is_active && (
                  <span className="px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{profile?.position || 'Employee'}</p>
              <p className="text-xs sm:text-sm text-gray-500">{profile?.department || 'No department'}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0 w-full sm:w-auto">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                Change Password
              </button>
              {!editing ? (
  <button
    onClick={() => setEditing(true)}
    className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 ${theme.button} text-white rounded-xl ${theme.buttonHover} transition-colors text-sm`}
  >
    <PencilIcon className="h-4 w-4 mr-2" />
    Edit Profile
  </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Progress Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className={`h-5 w-5 ${completion.percentage === 100 ? 'text-green-500' : 'text-blue-500'}`} />
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Profile Completion</h3>
          </div>
          <span className={`text-lg sm:text-xl font-bold ${completion.percentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
            {completion.percentage}%
          </span>
        </div>
        
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
              completion.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${completion.percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
        
        {completion.percentage === 100 ? (
          <div className="flex items-center gap-2 text-green-600 text-xs sm:text-sm">
            <CheckBadgeIcon className="h-4 w-4" />
            <span>Perfect! Your profile is complete!</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Complete your profile to help HR serve you better
            </p>
            {completion.missingFields.length > 0 && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Missing {completion.missingFields.length} {completion.missingFields.length === 1 ? 'field' : 'fields'}
                </summary>
                <ul className="mt-2 space-y-1 pl-4">
                  {completion.missingFields.map((field, index) => (
                    <li key={index} className="list-disc">• {field}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
        
        {completion.percentage < 100 && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="mt-3 w-full text-center text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Complete Your Profile Now →
          </button>
        )}
      </div>

      {/* Quick Stats */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
  <StatCard 
    title="Employee ID" 
    value={profile?.employee_code || 'Not assigned'} 
    icon={BriefcaseIcon}
    color={theme.statGradient}
  />
  <StatCard 
    title="Join Date" 
    value={profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString() : 'Not set'} 
    icon={CalendarIcon}
    color={theme.statGradient}
  />
  <StatCard 
    title="Department" 
    value={profile?.department || 'Not assigned'} 
    icon={UserGroupIcon}
    color={theme.statGradient}
  />
</div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <UserCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <InfoField 
              label="Full Name" 
              value={`${profile?.first_name} ${profile?.last_name}`} 
              icon={UserCircleIcon}
              isEditable={false}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Email Address" 
              value={user?.email} 
              icon={EnvelopeIcon}
              isEditable={false}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Phone Number" 
              value={profile?.phone} 
              icon={PhoneIcon}
              editField="phone"
              type="tel"
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Birth Date" 
              value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'} 
              icon={CakeIcon}
              editField="date_of_birth"
              type="date"
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
            Employment Information
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <InfoField 
              label="Employee Code" 
              value={profile?.employee_code || 'Not assigned'} 
              icon={BriefcaseIcon}
              isEditable={false}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Department" 
              value={profile?.department || 'Not assigned'} 
              icon={BriefcaseIcon}
              isEditable={false}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Position" 
              value={profile?.position || 'Not assigned'} 
              icon={BriefcaseIcon}
              isEditable={false}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Hire Date" 
              value={profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString() : 'Not set'} 
              icon={CalendarIcon}
              isEditable={false}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Employment Status" 
              value={
                <span className="text-sm sm:text-base">
                  {profile?.employment_status || 'Regular'}
                  {profile?.employment_status === 'probationary' && profile?.probationary_end_date && (
                    <span className="ml-2 text-xs text-yellow-600">
                      (Probationary until {new Date(profile.probationary_end_date).toLocaleDateString()})
                    </span>
                  )}
                </span>
              }
              icon={BriefcaseIcon}
              isEditable={false}
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            {profile?.regularization_date && (
              <InfoField 
                label="Regularization Date" 
                value={new Date(profile.regularization_date).toLocaleDateString()} 
                icon={CalendarIcon}
                isEditable={false}
                editing={editing}
                formData={formData}
                onInputChange={handleInputChange}
              />
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
            Address Information
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <InfoField 
              label="Street Address" 
              value={profile?.address} 
              icon={MapPinIcon}
              editField="address"
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <InfoField 
                label="City" 
                value={profile?.city} 
                icon={MapPinIcon}
                editField="city"
                editing={editing}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <InfoField 
                label="Province/State" 
                value={profile?.state} 
                icon={MapPinIcon}
                editField="state"
                editing={editing}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </div>
            <InfoField 
              label="ZIP Code" 
              value={profile?.zip_code} 
              icon={MapPinIcon}
              editField="zip_code"
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
            Emergency Contact
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <InfoField 
              label="Contact Name" 
              value={profile?.emergency_contact_name} 
              icon={UserGroupIcon}
              editField="emergency_contact_name"
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}
            />
            <InfoField 
              label="Contact Phone" 
              value={profile?.emergency_contact_phone} 
              icon={PhoneIcon}
              editField="emergency_contact_phone"
              type="tel"
              editing={editing}
              formData={formData}
              onInputChange={handleInputChange}             
            />
          </div>
        </div>
      </div>

      {/* Government IDs Section - Read-only for employees */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <IdentificationIcon className="h-5 w-5 mr-2 text-blue-600" />
          Government IDs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center mb-1">
              <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" />
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">SSS Number</span>
            </div>
            {editing && isAdmin ? (
              <input
                type="text"
                name="sss_number"
                value={formData.sss_number || ''}
                onChange={handleInputChange}
                placeholder="XX-XXXXXXX-X"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800 font-medium mt-1 text-sm sm:text-base">{profile?.sss_number || 'Not provided'}</p>
            )}
          </div>
          
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center mb-1">
              <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" />
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">PhilHealth Number</span>
            </div>
            {editing && isAdmin ? (
              <input
                type="text"
                name="philhealth_number"
                value={formData.philhealth_number || ''}
                onChange={handleInputChange}
                placeholder="XX-XXXXXXXXX-X"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800 font-medium mt-1 text-sm sm:text-base">{profile?.philhealth_number || 'Not provided'}</p>
            )}
          </div>
          
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center mb-1">
              <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" />
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Pag-IBIG Number</span>
            </div>
            {editing && isAdmin ? (
              <input
                type="text"
                name="pagibig_number"
                value={formData.pagibig_number || ''}
                onChange={handleInputChange}
                placeholder="XXXXXXXXXXXX"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800 font-medium mt-1 text-sm sm:text-base">{profile?.pagibig_number || 'Not provided'}</p>
            )}
          </div>
          
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center mb-1">
              <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" />
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">TIN Number</span>
            </div>
            {editing && isAdmin ? (
              <input
                type="text"
                name="tin_number"
                value={formData.tin_number || ''}
                onChange={handleInputChange}
                placeholder="XXX-XXX-XXX-XXX"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-800 font-medium mt-1 text-sm sm:text-base">{profile?.tin_number || 'Not provided'}</p>
            )}
          </div>
        </div>
        {!isAdmin && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            For security reasons, government ID numbers can only be updated by HR/Admin.
            Please contact your HR department for any changes.
          </p>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          setSuccessMessage('Password changed successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }}
      />
    </div>
  );
};

export default MyProfile;