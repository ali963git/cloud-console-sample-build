import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Home, TrendingUp, Wallet, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'لوحة التحكم' },
    { path: '/trading', icon: TrendingUp, label: 'التداول' },
    { path: '/wallet', icon: Wallet, label: 'المحفظة' }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-[hsl(var(--border))]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={user ? '/dashboard' : '/'} className="font-heading text-2xl font-black" data-testid="logo">
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">Nova</span>Dex
            </Link>

            {/* Desktop Navigation */}
            {!isPublicPage && user && (
              <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-blue-500/30'
                          : 'hover:bg-[hsl(var(--accent))]'
                      }`}
                      data-testid={`nav-${item.path.slice(1)}`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* User Actions */}
              {user && !isPublicPage && (
                <>
                  <div className="hidden md:flex items-center gap-3">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]" data-testid="user-name">
                      {user.full_name}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      data-testid="logout-button"
                    >
                      <LogOut className="w-5 h-5" />
                      تسجيل الخروج
                    </button>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                    data-testid="mobile-menu-button"
                  >
                    {mobileMenuOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && !isPublicPage && (
          <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]" data-testid="mobile-menu">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white shadow-lg'
                        : 'hover:bg-[hsl(var(--accent))]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors text-right"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      {isPublicPage && (
        <footer className="border-t border-[hsl(var(--border))] py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              © 2026 NovaDex. جميع الحقوق محفوظة.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
