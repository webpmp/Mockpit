/**
 * Mockpit — Automotive HMI Prototyping Tool
 * Copyright (c) 2026 Chris Adkins. All Rights Reserved.
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

console.log('Mockpit © 2026 Chris Adkins. All Rights Reserved.');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
