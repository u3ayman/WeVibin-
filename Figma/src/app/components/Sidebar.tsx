import { Home, Users, Radio, Settings } from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  activePartyCount: number;
}

export function Sidebar({ activeScreen, onNavigate, activePartyCount }: SidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'parties', label: 'Active Parties', icon: Radio, badge: activePartyCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <h1 className="text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
          WeVibin'
        </h1>
      </div>
      
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span>You</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate">Your Name</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-online shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span className="text-muted-foreground text-sm">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
