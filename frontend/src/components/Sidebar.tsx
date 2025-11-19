import { type User } from 'firebase/auth';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, History, Pill, Sun, Moon, LogOut } from 'lucide-react';

const Sidebar = ({ 
  user, 
  isDark, 
  toggleTheme, 
  onLogout 
}: { 
  user: User | null, 
  isDark: boolean, 
  toggleTheme: () => void, 
  onLogout: () => void 
}) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/schedule', label: 'Planner', icon: <Calendar size={20} /> },
    { path: '/history', label: 'History', icon: <History size={20} /> }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 z-20">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="bg-cyan-600 p-2 rounded-lg">
          <Pill className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">MedBox</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname === item.path 
                ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 font-semibold shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
              {user?.email}
            </span>
            <button onClick={toggleTheme} className="text-slate-400 hover:text-cyan-500">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-sm"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;