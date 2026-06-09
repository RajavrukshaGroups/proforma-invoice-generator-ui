import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus2, Settings as SettingsIcon, Moon, Sun, FileText, Users, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Create Invoice', path: '/create', icon: <FilePlus2 size={20} /> },
    { name: 'Invoice History', path: '/history-view', icon: <FileText size={20} /> },
    { name: 'Clients List', path: '/clients', icon: <Users size={20} /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar */}
      {sidebarOpen && (
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-6">
          <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-blue-600 text-white p-2 rounded-lg">PI</span>
            Proforma Invoice Generator
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
        {/* <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
    <X size={20} />
  </button> */}
</aside>
    )}
    {!sidebarOpen && (
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 p-2 bg-blue-600 text-white rounded-lg shadow-md"
      >
        <Menu size={20} />
      </button>
    )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
