import { useState } from 'react';
import { 
  BookOpenIcon, 
  ScaleIcon, 
  StarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CompanyPolicies = () => {
  const [activeTab, setActiveTab] = useState('intro');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [currentPdf, setCurrentPdf] = useState(null);
  const [currentPdfTitle, setCurrentPdfTitle] = useState('');

  const tabs = [
    {
      id: 'intro',
      label: 'Code of Behaviors - Introduction',
      icon: BookOpenIcon,
      color: 'blue',
      pdfFile: '/code-of-behaviors-intro.pdf',
      summary: [
        'Overview of company values and expectations',
        'Purpose and scope of the code of behaviors',
        'Commitment to professional excellence',
        'Employee responsibilities and accountabilities',
        'Company culture and work environment'
      ]
    },
    {
      id: 'rules',
      label: 'Rules & Regulations',
      icon: ScaleIcon,
      color: 'yellow',
      pdfFile: '/code-of-behaviors-rules.pdf',
      summary: [
        'Attendance and punctuality requirements',
        'Leave request procedures and guidelines',
        'Workplace conduct and professionalism',
        'Safety protocols and emergency procedures',
        'Disciplinary actions and consequences'
      ]
    },
    {
      id: 'vision',
      label: 'Vision, Mission & Core Values',
      icon: StarIcon,
      color: 'purple',
      pdfFile: '/vision-mission-core-values.pdf',
      summary: [
        'Company vision statement and long-term goals',
        'Mission statement and purpose',
        'Core values that guide our actions',
        'Commitment to service excellence',
        'Teamwork and collaboration principles'
      ]
    }
  ];

  const handleViewPDF = (pdfFile, title) => {
    setCurrentPdf(pdfFile);
    setCurrentPdfTitle(title);
    setShowPdfModal(true);
  };

  const handleDownloadPDF = (pdfFile) => {
    const link = document.createElement('a');
    link.href = pdfFile;
    link.download = pdfFile.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getColorClasses = (color) => {
    switch(color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
          tabActive: 'border-blue-600 text-blue-600',
          tabHover: 'hover:text-blue-600'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          tabActive: 'border-yellow-600 text-yellow-600',
          tabHover: 'hover:text-yellow-600'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          icon: 'text-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700',
          tabActive: 'border-purple-600 text-purple-600',
          tabHover: 'hover:text-purple-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700',
          tabActive: 'border-gray-600 text-gray-600',
          tabHover: 'hover:text-gray-600'
        };
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const colors = getColorClasses(currentTab?.color || 'blue');

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <ShieldCheckIcon className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Employee Handbook</h1>
            </div>
            <p className="text-blue-100">
              Our commitment to excellence, integrity, and professionalism
            </p>
            <p className="text-blue-200 text-sm mt-2">
              📄 Complete handbook with 3 sections | Last updated: January 2024
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const tabColors = getColorClasses(tab.color);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? `border-b-2 ${tabColors.tabActive} bg-white`
                    : `text-gray-600 ${tabColors.tabHover} hover:bg-gray-100`
                }`}
              >
                <tab.icon className={`h-5 w-5 mr-2 ${activeTab === tab.id ? tabColors.icon : 'text-gray-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split('-')[0]}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* PDF Viewer Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <currentTab.icon className={`h-6 w-6 ${colors.icon}`} />
                <h2 className={`text-lg font-semibold ${colors.text}`}>
                  {currentTab?.label}
                </h2>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleViewPDF(currentTab?.pdfFile, currentTab?.label)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Document
                </button>
                <button
                  onClick={() => handleDownloadPDF(currentTab?.pdfFile)}
                  className={`inline-flex items-center px-4 py-2 ${colors.button} text-white rounded-lg transition-colors text-sm font-medium`}
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>

            {/* Document Preview Card */}
            <div className={`border ${colors.border} rounded-xl overflow-hidden bg-gray-50 cursor-pointer hover:shadow-md transition-shadow`}
                 onClick={() => handleViewPDF(currentTab?.pdfFile, currentTab?.label)}>
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Click to view document</span>
                </div>
                <EyeIcon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-600 mb-2 font-medium">{currentTab?.label}</p>
                <p className="text-sm text-gray-400">Click to read the full document</p>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className={`rounded-xl p-5 ${colors.bg} border ${colors.border}`}>
            <h3 className={`font-semibold ${colors.text} mb-3 flex items-center`}>
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Key Points Summary
            </h3>
            <ul className="space-y-2">
              {currentTab?.summary.map((point, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className={`h-4 w-4 ${colors.icon} mr-2 flex-shrink-0 mt-0.5`} />
                  <span className="text-sm text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                📖 For complete details, click "View Document" to read the full PDF.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {currentPdfTitle}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadPDF(currentPdf)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Download PDF"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${currentPdf}#toolbar=0`}
                title={currentPdfTitle}
                className="w-full h-full"
                style={{ border: 'none' }}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                For the best experience, use the zoom controls or download the PDF.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(currentPdf, '_blank')}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={() => handleDownloadPDF(currentPdf)}
                  className={`px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition`}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgment Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sticky bottom-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Please acknowledge that you have read and understood the company policies.
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                This acknowledgment confirms your commitment to following these guidelines.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('policies_acknowledged', 'true');
              alert('Thank you for acknowledging the company policies!');
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm whitespace-nowrap"
          >
            I Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyPolicies;