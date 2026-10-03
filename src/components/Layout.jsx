import React, { useState, useEffect } from 'react';
import {
  Outlet,
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  FileText, 
  Users, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("pi_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pi_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const user = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw || raw === "undefined" || raw === "null") return {};
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to parse user from localStorage:", e);
      return {};
    }
  })();

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

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isCollapsed;

    return (
      <aside
        className={`flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header: Logo + Toggle / Close Button */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 min-h-[64px]">
          {collapsed ? (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={toggleCollapse}
                className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 transition-all cursor-pointer group shadow-2xs"
                title="Expand Sidebar"
              >
                <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-extrabold select-none">
                  PI
                </span>
                <PanelLeftOpen size={16} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 overflow-hidden select-none">
                <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-extrabold shrink-0">
                  PI
                </span>
                <span className="leading-tight truncate">Proforma Invoice</span>
              </h1>

              {/* Desktop Minimize Button */}
              {!isMobile && (
                <button
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                  title="Minimize Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              )}

              {/* Mobile Close Button */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.name}
                className={`flex items-center ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
                } rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        {collapsed ? (
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-3 flex flex-col items-center">
            {/* User initial avatar */}
            <div
              className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm cursor-default ring-1 ring-blue-500/20 select-none"
              title={`Logged in as ${user?.name || 'User'} (${user?.email || ''})`}
            >
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Theme toggle icon button */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-center transition-colors cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Logout icon button */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <div className="px-2 py-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Logged in as
              </p>
              <p className="font-bold text-slate-800 dark:text-white truncate text-sm">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate dark:text-slate-400">
                {user?.email}
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium cursor-pointer"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden">
      {/* ── DESKTOP sidebar (always visible lg+) ── */}
      <div className={`hidden lg:flex flex-col shrink-0 transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent isMobile={false} />
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
        <SidebarContent isMobile={true} />
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
