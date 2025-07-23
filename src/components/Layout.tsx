import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Mic, BookOpen, Repeat, Home, Menu, X, LogOut, User, Settings, Plus, Calendar } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import NotificationBell from './NotificationBell';
import clsx from 'clsx';

const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth0();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
          isActive
            ? 'bg-blue-100 text-blue-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        )
      }
      onClick={() => setMobileMenuOpen(false)}
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Mic className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold text-gray-900">Speak & Learn</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-2">
              <NavItem to="/" icon={Home} label="Dashboard" />
              {/* <NavItem to="/repeat" icon={Repeat} label="Repeat" /> */}
              <NavItem to="/phrases" icon={BookOpen} label="Phrases" />
              <NavItem to="/shadow" icon={Mic} label="Shadow" />
              <NavItem to="/add-phrase" icon={Plus} label="Add Phrase" />
              {/* {process.env.NODE_ENV === 'development' && (
                <>
                  <NavItem to="/calendar" icon={Calendar} label="Calendar" />
                  <NavItem to="/api-tester" icon={Settings} label="Apis" />
                </>
              )} */}
            </nav>
            
            {isAuthenticated && user && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <NotificationBell />
                
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )
                  }
                >
                  <User size={20} />
                  <span className="hidden sm:inline">
                    {user.displayName || user.email}
                  </span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
          
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile menu */}
      <div
        className={clsx(
          'md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity',
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={toggleMobileMenu}
      />
      <div
        className={clsx(
          'md:hidden fixed right-0 top-0 bottom-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="text-blue-600" size={24} />
              <span className="font-semibold text-lg">Speak & Learn</span>
            </div>
            <button
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={toggleMobileMenu}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <NavItem to="/" icon={Home} label="Dashboard" />
          <NavItem to="/repeat" icon={Repeat} label="Repeat" />
          <NavItem to="/phrases" icon={BookOpen} label="Phrases" />
          <NavItem to="/add-phrase" icon={Plus} label="Add Phrase" />
          <NavItem to="/calendar" icon={Calendar} label="Calendar" />
          <NavItem to="/profile" icon={User} label="Profile" />
          <NavItem to="/shadow" icon={Mic} label="Shadow" />
          {process.env.NODE_ENV === 'development' && (
            <NavItem to="/api-tester" icon={Settings} label="Apis" />
          )}
          
          {isAuthenticated && user && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          )}
        </nav>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Speak & Learn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;