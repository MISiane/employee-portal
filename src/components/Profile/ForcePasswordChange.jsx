import { useAuth } from '../../context/AuthContext';
import { getCurrentUser } from '../../api/auth';
import ChangePasswordModal from './ChangePasswordModal';

// Shown instead of the portal until a person with a temporary password picks their own.
const ForcePasswordChange = () => {
  const { user, updateUser, logout } = useAuth();

  const handleSuccess = async () => {
    try {
      updateUser(await getCurrentUser());
    } catch (error) {
      updateUser({ ...user, must_change_password: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
      <ChangePasswordModal isOpen required onClose={() => {}} onSuccess={handleSuccess} />
      <button
        onClick={logout}
        className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-white px-4 py-2 text-sm text-gray-700 shadow hover:bg-gray-50"
      >
        Log out
      </button>
    </div>
  );
};

export default ForcePasswordChange;
