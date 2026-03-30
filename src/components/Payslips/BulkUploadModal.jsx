import { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import api from '../../api/config';

const BulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewFile(selectedFile);
    }
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      setPreview(jsonData.slice(0, 5)); // Show first 5 rows as preview
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/payslips/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payslip_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error downloading template');
    }
  };

const handleUpload = async () => {
  if (!file) {
    setError('Please select a file to upload');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  setLoading(true);
  setError('');
  setUploadProgress(0);

  try {
    const response = await api.post('/payslips/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }
    });

    console.log('Bulk upload response:', response.data);
    
    const result = response.data;
    
    if (result.results.success.length > 0) {
      console.log('Successfully created payslips:', result.results.success);
    }
    
    if (result.results.failed.length > 0) {
      console.log('Failed records:', result.results.failed);
    }
    
    // Pass the result to parent
    onSuccess(result);
    onClose();
  } catch (error) {
    console.error('Upload error:', error);
    setError(error.response?.data?.error || 'Error uploading file');
  } finally {
    setLoading(false);
    setUploadProgress(0);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bulk Upload Payslips</h2>
            <p className="text-sm text-gray-500 mt-1">Upload an Excel file to create multiple payslips at once</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Template Download */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Step 1: Download Template</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download the Excel template to see the required format. Fill in the payslip data for all employees.
            </p>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Step 2: Upload Filled Template</h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload the filled Excel file. The system will validate and create payslips for all employees.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2 text-gray-500" />
                Choose File
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value, valIdx) => (
                          <td key={valIdx} className="px-3 py-2 text-xs text-gray-600">
                            {String(value).substring(0, 30)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload & Create Payslips'}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Employee Code must match existing employees in the system</li>
              <li>• Date format: YYYY-MM-DD (e.g., 2024-03-15)</li>
              <li>• Leave amount fields empty to use zero (0)</li>
              <li>• Amount Subject to Tax and other totals are calculated automatically</li>
              <li>• Status can be: generated, sent, or paid</li>
              <li>• The system will validate each row and report any errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;