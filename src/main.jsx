import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initMonitoring } from './utils/monitoring'

// Initialize monitoring
initMonitoring();

// Register service worker for PWA (Progressive Web App)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Check if app is installed as PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('📱 App is running as installed PWA');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)