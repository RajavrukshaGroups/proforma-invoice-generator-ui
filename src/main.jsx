import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
