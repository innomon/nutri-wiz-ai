import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Application failed to mount:", error);
  // Display error on screen for mobile debugging
  document.body.innerHTML = `
    <div style="padding: 20px; color: #ef4444; font-family: sans-serif; background: #0f172a; height: 100vh;">
      <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Failed to load app</h1>
      <pre style="white-space: pre-wrap; font-size: 0.8rem; background: #1e293b; padding: 1rem; rounded: 0.5rem; overflow: auto;">
        ${error instanceof Error ? error.message : String(error)}
      </pre>
    </div>
  `;
}