import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver loop error
const resizeObserverLoopErr = /ResizeObserver loop completed with undelivered notifications/;
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && resizeObserverLoopErr.test(args[0])) return;
  originalError(...args);
};

window.addEventListener('error', (e) => {
  if (resizeObserverLoopErr.test(e.message)) {
    e.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
