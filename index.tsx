import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/oswald';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-serif-4/opsz-italic.css';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/nunito';
import '@fontsource-variable/space-grotesk';
import '@fontsource/dm-serif-display';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);