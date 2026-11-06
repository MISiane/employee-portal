import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { setSupervisorDepartments } from '../../api/leave';

// Admin picks the departments an employee supervises. Leave requests from those
// departments wait for this person's approval before reaching the admin.
const SupervisorModal = ({ isOpen, onClose, onSaved, employee, departments, current }) => {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelected(current || []);
      setError('');
    }
  }, [isOpen, current]);

  if (!isOpen || !employee) return null;

  // Departments from the list, plus any already assigned that are no longer in it
  // (so they can still be removed)
  const names = departments.map((d) => d.name);
  const options = [...names, ...(current || []).filter((d) => !names.includes(d))];
  const key = (d) => d.trim().toLowerCase();
  const isChecked = (d) => selected.some((s) => key(s) === key(d));

  const toggle = (d) => {
    setSelected((prev) =>
      prev.some((s) => key(s) === key(d)) ? prev.filter((s) => key(s) !== key(d)) : [...prev, d]
    );
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await setSupervisorDepartments(employee.id, selected);
      onSaved(result);
    } catch (e) {
      setError(
        e.response?.status === 503
          ? 'Supervisor approval is not available on the server yet.'
          : e.response?.data?.error || 'Could not save.'
      );
    } finally {
      setSaving(false);
    }
  };

  const ownDept = employee.department;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Department supervisor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-600">
          Departments <strong>{employee.first_name} {employee.last_name}</strong> approves leave
          for. Their requests from these departments go to them first, then to you. Several people
          can supervise the same department; any one of them can approve.
        </p>

        <div className="mb-3 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
          {options.length === 0 && <p className="p-2 text-sm text-gray-500">No departments yet.</p>}
          {options.map((d) => (
            <label key={d} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-purple-50">
              <input
                type="checkbox"
                checked={isChecked(d)}
                onChange={() => toggle(d)}
                className="h-4 w-4 accent-[#800080]"
              />
              <span className="text-sm text-gray-800">
                {d}
                {ownDept && key(d) === key(ownDept) && (
                  <span className="ml-2 text-xs text-gray-400">(their own department)</span>
                )}
              </span>
            </label>
          ))}
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Their own leave requests always go straight to you. Un-ticking every department removes
          them as a supervisor; requests waiting on a department left with no supervisor then move
          to you.
        </p>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#800080] px-4 py-2 text-white transition hover:bg-[#660066] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorModal;
