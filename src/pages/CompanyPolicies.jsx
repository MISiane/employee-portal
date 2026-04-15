import { useState, useEffect } from 'react';
import { 
  BookOpenIcon, 
  ScaleIcon, 
  StarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const CompanyPolicies = () => {
  const [activeTab, setActiveTab] = useState('intro');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [currentPdf, setCurrentPdf] = useState(null);
  const [currentPdfTitle, setCurrentPdfTitle] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    {
      id: 'intro',
      label: 'Code of Behaviors - Introduction',
      shortLabel: 'Introduction',
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
      shortLabel: 'Rules',
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
      shortLabel: 'Vision',
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
    if (isMobile) {
      // On mobile, open in new tab directly (better experience)
      window.open(pdfFile, '_blank');
    } else {
      setCurrentPdf(pdfFile);
      setCurrentPdfTitle(title);
      setShowPdfModal(true);
    }
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
          tabActive: 'border-b-2 border-blue-600 text-blue-600 bg-blue-50',
          tabInactive: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
          cardBg: 'bg-blue-50',
          summaryBg: 'bg-blue-50'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          tabActive: 'border-b-2 border-yellow-600 text-yellow-600 bg-yellow-50',
          tabInactive: 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50',
          cardBg: 'bg-yellow-50',
          summaryBg: 'bg-yellow-50'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          icon: 'text-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700',
          tabActive: 'border-b-2 border-purple-600 text-purple-600 bg-purple-50',
          tabInactive: 'text-gray-600 hover:text-purple-600 hover:bg-purple-50',
          cardBg: 'bg-purple-50',
          summaryBg: 'bg-purple-50'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700',
          tabActive: 'border-b-2 border-gray-600 text-gray-600 bg-gray-50',
          tabInactive: 'text-gray-600 hover:text-gray-600 hover:bg-gray-50',
          cardBg: 'bg-gray-50',
          summaryBg: 'bg-gray-50'
        };
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const colors = getColorClasses(currentTab?.color || 'blue');

  // Mobile tab navigation with arrows
  const prevTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    setActiveTab(tabs[prevIndex].id);
  };

  const nextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    setActiveTab(tabs[nextIndex].id);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header - Responsive */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
              <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              <h1 className="text-xl sm:text-2xl font-bold">Employee Handbook</h1>
            </div>
            <p className="text-blue-100 text-xs sm:text-sm">
              Our commitment to excellence, integrity, and professionalism
            </p>
            <p className="text-blue-200 text-xs mt-1 sm:mt-2">
              📄 3 sections
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation with Arrows */}
      {isMobile && (
        <div className="flex items-center justify-between gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <button
            onClick={prevTab}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-2">
              <currentTab.icon className={`h-5 w-5 ${colors.icon}`} />
              <span className={`font-medium text-sm ${colors.text}`}>
                {currentTab?.shortLabel}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px] mx-auto">
              {currentTab?.label}
            </p>
          </div>
          
          <button
            onClick={nextTab}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Desktop Tabs - Hidden on mobile */}
      {!isMobile && (
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
                      ? tabColors.tabActive
                      : tabColors.tabInactive
                  }`}
                >
                  <tab.icon className={`h-5 w-5 mr-2 ${activeTab === tab.id ? tabColors.icon : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6">
          {/* PDF Viewer Section - Mobile Optimized */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <currentTab.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.icon}`} />
                <h2 className={`text-base sm:text-lg font-semibold ${colors.text}`}>
                  {currentTab?.label}
                </h2>
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => handleViewPDF(currentTab?.pdfFile, currentTab?.label)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View
                </button>
                <button
                  onClick={() => handleDownloadPDF(currentTab?.pdfFile)}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 ${colors.button} text-white rounded-lg transition-colors text-sm font-medium`}
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>

            {/* Document Preview Card - Mobile Optimized */}
            {/* <div 
              className={`border ${colors.border} rounded-xl overflow-hidden bg-gray-50 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleViewPDF(currentTab?.pdfFile, currentTab?.label)}
            >
              <div className="bg-gray-100 px-3 sm:px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Tap to view document</span>
                </div>
                <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              </div>
              <div className="p-6 sm:p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 mb-3 sm:mb-4">
                  <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
                </div>
                <p className="text-gray-600 mb-1 sm:mb-2 font-medium text-sm sm:text-base">{currentTab?.label}</p>
                <p className="text-xs text-gray-400">Tap to read the full document</p>
              </div>
            </div> */}
          </div>

          {/* Summary Section - Mobile Optimized */}
          <div className={`rounded-xl p-4 sm:p-5 ${colors.summaryBg} border ${colors.border}`}>
            <h3 className={`font-semibold ${colors.text} mb-3 flex items-center text-sm sm:text-base`}>
              <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Key Points Summary
            </h3>
            <ul className="space-y-2">
              {currentTab?.summary.map((point, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${colors.icon} mr-2 flex-shrink-0 mt-0.5`} />
                  <span className="text-xs sm:text-sm text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                📖 Tap "View" to read the full document
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop PDF Modal - Only show on desktop */}
      {!isMobile && showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-md">
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
              <p className="text-xs text-gray-500 hidden sm:block">
                For the best experience, use the zoom controls or download the PDF.
              </p>
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => window.open(currentPdf, '_blank')}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={() => handleDownloadPDF(currentPdf)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition`}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgment Section - Mobile Optimized */}
      {/* <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 sticky bottom-2 sm:bottom-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-800">
                Please acknowledge that you have read the policies.
              </p>
              <p className="text-xs text-yellow-700 mt-0.5 sm:mt-1 hidden sm:block">
                This confirms your commitment to following these guidelines.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('policies_acknowledged', 'true');
              alert('Thank you for acknowledging the company policies!');
            }}
            className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            I Acknowledge
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default CompanyPolicies;