import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LayoutDashboard, 
  Languages, 
  Mic, 
  Subtitles, 
  FileText, 
  Image as ImageIcon, 
  FolderGit2, 
  History, 
  BookA, 
  Bot, 
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Sun,
  Search,
  Moon
} from 'lucide-react';
import { Button } from './Button';

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const sidebarOpen = isDesktopOpen || isHovered;
  const [searchQuery, setSearchQuery] = useState('');
  const { themeColor, setThemeColor, isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Translate', href: '/translator', icon: Languages },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'History', href: '/history', icon: History },
    { name: 'Glossary', href: '/glossaries', icon: BookA },
    { name: 'Memory', href: '/memory', icon: BookA },
    { name: 'Teams', href: '/teams', icon: BookA },
    { name: 'AI Assistant', href: '/assistant', icon: Bot },
    // { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
        fixed inset-y-0 left-0 z-50 glass-panel transform transition-all duration-300 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        lg:static lg:inset-auto lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-[72px]'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-border">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'lg:hidden'}`}>
            <Globe className="h-6 w-6 text-primary shrink-0" />
            <span className="text-lg font-bold text-text-main whitespace-nowrap">OneClick AI</span>
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-text-muted hover:text-text-main">
            <X className="h-5 w-5" />
          </button>
          {/* Desktop Toggle Button */}
          <button onClick={() => setIsDesktopOpen(!isDesktopOpen)} className="hidden lg:flex text-text-muted hover:text-text-main mx-auto">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${!sidebarOpen && 'lg:justify-center'} ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
                    : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
                }`
              }
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={`whitespace-nowrap ${!sidebarOpen && 'lg:hidden'}`}>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors ${!sidebarOpen && 'lg:justify-center'}`}
            title={!sidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`whitespace-nowrap ${!sidebarOpen && 'lg:hidden'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 border-b border-border glass flex items-center justify-between px-4 lg:px-8 z-30">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden text-text-muted hover:text-text-main p-2 -ml-2"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-text-main hidden sm:block">
                 Welcome back, {user?.name || user?.email?.split('@')[0] || 'Alex'}
              </h1>
              
              {/* Dark/Light Mode Toggle - Moved to Left Side */}
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-surface hover:border-primary text-text-muted hover:text-primary transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-4 ml-auto">
               <div className="relative hidden md:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search..." 
                   className="bg-surface border border-border rounded-lg pl-10 pr-4 py-1.5 text-sm text-text-main placeholder-text-disabled focus:outline-none focus:border-primary w-64 transition-colors"
                 />
               </div>

               {/* Custom Theme Color Picker */}
               <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-surface overflow-hidden hover:border-primary transition-colors mr-2" title="Custom Theme Color">
                 <input 
                   type="color" 
                   value={themeColor}
                   onChange={(e) => setThemeColor(e.target.value)}
                   className="w-12 h-12 -m-2 cursor-pointer border-none p-0 bg-transparent"
                 />
               </div>

               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-background font-bold text-sm shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                 {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
               </div>
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

