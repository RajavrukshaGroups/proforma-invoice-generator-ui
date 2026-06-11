import React, { useState, useEffect } from 'react';
// import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Outlet,
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { LayoutDashboard, FilePlus2, Settings as SettingsIcon, Moon, Sun, FileText, Users, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

const user = JSON.parse(
  localStorage.getItem("user") || "{}"
);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  navigate("/login");
};
  // Close sidebar when clicking outside (mobile overlay)
  const handleOverlayClick = () => setSidebarOpen(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Create Invoice', path: '/create', icon: <FilePlus2 size={20} /> },
    { name: 'Invoice History', path: '/history-view', icon: <FileText size={20} /> },
    { name: 'Clients List', path: '/clients', icon: <Users size={20} /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const SidebarContent = () => (
    <aside className="flex flex-col h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      {/* Logo + close button (mobile only) */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
        <h1 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-extrabold">PI</span>
          <span className="leading-tight">Proforma Invoice</span>
        </h1>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
              location.pathname === item.path
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Theme toggle at bottom */}
      {/* <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div> */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">

  <div className="px-4 py-2">
    <p className="text-xs text-slate-600 dark:text-slate-400">
      Logged in as
    </p>

    <p className="font-medium text-slate-800 dark:text-white">
      {user?.name || "User"}
    </p>

    <p className="text-xs text-slate-600 truncate dark:text-slate-400">
      {user?.email}
    </p>
  </div>

  <button
    onClick={toggleTheme}
    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium"
  >
    {theme === "light"
      ? <Moon size={20} />
      : <Sun size={20} />}
    {theme === "light"
      ? "Dark Mode"
      : "Light Mode"}
  </button>

  <button
    onClick={handleLogout}
    className="w-full px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
  >
    Logout
  </button>

</div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden">

      {/* ── DESKTOP sidebar (always visible lg+) ── */}
      <div className="hidden lg:flex flex-col shrink-0">
        <SidebarContent />
      </div>

      {/* ── MOBILE: overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE: slide-in drawer ── */}
      <div
        className={`fixed top-0 left-0 z-50 h-full transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── MOBILE top bar ── */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-extrabold">PI</span>
            Proforma Invoice
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
