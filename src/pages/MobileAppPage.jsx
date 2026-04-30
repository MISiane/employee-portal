import { CloudArrowDownIcon, DevicePhoneMobileIcon, ShieldCheckIcon, QuestionMarkCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const MobileAppPage = () => {
  const apkDownloadLink = "https://drive.google.com/file/d/10TNJQI9ZDxi-blL1M5Fjxkl1JfzlMHP9/view?usp=drive_link"; 

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Mobile App</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Install the Employee Portal on your Android device
          </p>
        </div>

        {/* Download Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-5 sm:p-6 text-white text-center shadow-lg">
          <div className="bg-white/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <DevicePhoneMobileIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-1">Employee Portal</h2>
          <p className="text-white/80 text-xs sm:text-sm mb-4">Version 1.0.0</p>
          <a
            href={apkDownloadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-purple-700 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-100 transition shadow-lg"
          >
            <CloudArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Download APK
          </a>
          <p className="text-xs text-white/60 mt-3">
            File size: ~5MB • Android 8.0+
          </p>
        </div>

        {/* Installation Instructions - Mobile Friendly */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <QuestionMarkCircleIcon className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
              How to Install
            </h3>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Tap the <span className="font-semibold text-purple-600">Download APK</span> button above
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Open the downloaded file from your notification bar or Downloads folder
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  If prompted, tap <span className="font-semibold">"Settings"</span> and enable{' '}
                  <span className="font-semibold">"Allow from this source"</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This is safe - it's our company app
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">4</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Go back and tap <span className="font-semibold text-green-600">"Install"</span>
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">5</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Tap <span className="font-semibold text-green-600">"Open"</span> and log in with your employee credentials
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips Card */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Quick Tips:</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Make sure you have enough storage space (at least 50MB free)</li>
                <li>• If download doesn't start, try a different browser (Chrome recommended)</li>
                <li>• The app will update automatically when you open it</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">✓ Safe & Secure</p>
              <p className="text-xs text-green-700 mt-1">
                This app is developed internally by Le Monet Hotel. The APK is verified and 
                does not request unnecessary permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting Accordion */}
        <details className="bg-yellow-50 rounded-xl border border-yellow-200">
          <summary className="text-sm font-medium text-yellow-800 cursor-pointer p-4 list-none">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>Having trouble installing?</span>
              <span className="ml-auto text-xs text-yellow-600">▼</span>
            </div>
          </summary>
          <div className="px-4 pb-4 pt-2 text-xs text-yellow-700 space-y-2 border-t border-yellow-200">
            <p><span className="font-semibold">• "Install blocked"</span> - Go to Settings → Security → Enable "Unknown sources"</p>
            <p><span className="font-semibold">• "File won't download"</span> - Check your internet connection and try again</p>
            <p><span className="font-semibold">• "App won't open"</span> - Make sure you have Android 8.0 or newer</p>
            <p><span className="font-semibold">• "Parse error"</span> - The APK may be corrupted. Try downloading again</p>
            <p className="pt-2 text-center text-yellow-800">
              Still stuck? Contact IT at <span className="font-mono">ianemina.artstream@gmail.com</span>
            </p>
          </div>
        </details>

        {/* Footer spacer */}
        <div className="h-4"></div>
      </div>
    </div>
  );
};

export default MobileAppPage;