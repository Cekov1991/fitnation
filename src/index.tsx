/* Ionic CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Register Service Worker for PWA functionality
// Skip on iOS - service workers can cause issues on iOS Safari
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

if ('serviceWorker' in navigator && !isIOS) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// Unregister any existing service workers on iOS (cleanup from previous visits)
if ('serviceWorker' in navigator && isIOS) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);