import { useState, useEffect } from 'react';
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
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { getEmployeeById, updateEmployee } from '../api/employees';
import ChangePasswordModal from '../components/Profile/ChangePasswordModal';

// Move InfoField outside the component to prevent re-creation
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

// Move StatCard outside the component
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

  useEffect(() => {
    fetchProfile();
  }, [user]);

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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-20 sm:h-32"></div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-10 sm:-mt-12 mb-4">
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white p-1 shadow-lg">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
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
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard 
          title="Employee ID" 
          value={profile?.employee_code || 'Not assigned'} 
          icon={BriefcaseIcon}
          color="from-blue-500 to-blue-600"
        />
        <StatCard 
          title="Join Date" 
          value={profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString() : 'Not set'} 
          icon={CalendarIcon}
          color="from-green-500 to-green-600"
        />
        <StatCard 
          title="Department" 
          value={profile?.department || 'Not assigned'} 
          icon={UserGroupIcon}
          color="from-purple-500 to-purple-600"
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
                label="State" 
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

      {/* Government IDs Section */}
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
            {editing ? (
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
            {editing ? (
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
            {editing ? (
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
            {editing ? (
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