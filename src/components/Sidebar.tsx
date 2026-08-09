import { LayoutDashboard, Newspaper, Terminal, Inbox, Settings, Cpu, History, RotateCcw, Sparkles, Sun, Moon } from 'lucide-react';
import type { Persona } from '../types';

export type Page = 'dashboard' | 'activity' | 'queue' | 'feed' | 'history' | 'system' | 'settings';

const NAV: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'activity',  label: 'Activity',   icon: Terminal        },
  { id: 'queue',     label: 'Pipeline',   icon: Inbox           },
  { id: 'feed',      label: 'Feed',       icon: Newspaper       },
  { id: 'history',   label: 'History',    icon: History         },
  { id: 'system',    label: 'System',     icon: Cpu             },
  { id: 'settings',  label: 'Settings',   icon: Settings        },
];

export function Sidebar({
  page,
  setPage,
  persona,
  postCount,
  bookmarkCount,
  onReset,
  theme,
  onToggleTheme,
  ctrl,
}: {
  page: Page;
  setPage: (p: Page) => void;
  persona: Persona;
  postCount: number;
  bookmarkCount: number;
  onReset: () => void;
  theme?: string;
  onToggleTheme?: () => void;
  ctrl?: any;
}) {
  const queueCount = ctrl?.state?.scans[0]?.scored?.filter((s: any) => s.accepted)?.length || 0;

  return (
    <header
      className="glass-navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Main Top Header Bar */}
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 16px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'space-between'
        }}
      >
        {/* Brand */}
        <button
          onClick={() => setPage('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 8px 0 0',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(34, 211, 238, 0.4)'
            }}
          >
            <Sparkles size={14} color="white" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}
          >
            NAVRACHNA
          </span>
        </button>

        {/* Desktop Nav tabs (Hidden on mobile) */}
        <nav
          className="hidden md:flex"
          style={{
            flex: 1,
            alignItems: 'center',
            gap: 4,
            marginLeft: 12,
            padding: '4px 0',
          }}
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  fontFamily: 'var(--font-sans)',
                  border: active ? '1px solid var(--border-default)' : '1px solid transparent',
                  background: active ? 'var(--bg-card)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: active ? 'var(--shadow-card)' : 'none',
                }}
              >
                <Icon
                  size={14}
                  color={active ? 'var(--accent)' : 'currentColor'}
                  style={{ flexShrink: 0 }}
                />
                <span>{item.label}</span>
                {item.id === 'queue' && queueCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-border)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    {queueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Status Badge + Theme Switcher + Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'var(--success-soft)',
              border: '1px solid var(--success-border)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}
            className="hidden sm:flex"
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'block',
                flexShrink: 0,
                boxShadow: '0 0 6px var(--success)',
                animation: 'pulse-soft 2s ease-in-out infinite',
              }}
            />
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>LIVE</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {persona.domain}
            </span>
          </div>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                height: 34,
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={14} className="text-accent" />
                  <span className="hidden sm:inline" style={{ color: 'var(--text-primary)' }}>DARK</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-warning" />
                  <span className="hidden sm:inline" style={{ color: 'var(--text-primary)' }}>LIGHT</span>
                </>
              )}
            </button>
          )}

          {/* Reset Session Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset the agent session? Everything will be deleted and reset to the beginning.')) {
                onReset();
              }
            }}
            title="Reset agent session"
            style={{
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              flexShrink: 0,
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Header Navigation Strip (Visible on mobile screens < 768px) */}
      <div
        className="flex md:hidden"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '6px 12px',
          overflowX: 'auto',
          gap: 6,
          background: 'var(--bg-inset)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
        }}
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                fontWeight: active ? 700 : 500,
                background: active ? 'var(--bg-card)' : 'transparent',
                border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer',
                boxShadow: active ? 'var(--glow-cyan)' : 'none',
              }}
            >
              <Icon size={14} color={active ? 'var(--accent)' : 'currentColor'} />
              <span>{item.label}</span>
              {item.id === 'queue' && queueCount > 0 && (
                <span className="badge badge-cyan" style={{ fontSize: 10, padding: '1px 5px' }}>
                  {queueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
