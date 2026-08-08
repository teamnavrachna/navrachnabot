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
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 24px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Brand — fixed width */}
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
            padding: '0 12px 0 0',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            marginRight: 8,
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
            }}
          >
            <Sparkles size={14} color="white" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}
          >
            NAVARACHNA
          </span>
        </button>

        {/* Nav tabs */}
        <nav
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
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
                  gap: 5,
                  padding: '5px 11px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  fontFamily: 'var(--font-sans)',
                  border: active ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent',
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Icon
                  size={13}
                  color={active ? 'var(--accent)' : 'currentColor'}
                  style={{ flexShrink: 0 }}
                />
                <span className="hidden sm:inline">{item.label}</span>
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

        {/* Right: agent status + reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.07)',
              border: '1px solid rgba(34, 197, 94, 0.18)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}
            className="hidden lg:flex"
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22C55E',
                display: 'block',
                flexShrink: 0,
                boxShadow: '0 0 6px #22C55E',
                animation: 'pulse-soft 2s ease-in-out infinite',
              }}
            />
            <span style={{ color: '#22C55E', fontWeight: 600 }}>LIVE</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-tertiary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {persona.domain}
            </span>
          </div>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                height: 32,
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                flexShrink: 0,
              }}
              className="hover:border-accent hover:text-primary"
            >
              {theme === 'light' ? (
                <>
                  <Moon size={14} className="text-accent" />
                  <span className="hidden sm:inline">DARK</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-warning" />
                  <span className="hidden sm:inline">LIGHT</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset the agent session? Everything will be deleted and reset to the beginning.')) {
                onReset();
              }
            }}
            title="Reset agent session"
            style={{
              width: 32,
              height: 32,
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
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.color = '#EF4444';
              el.style.background = 'rgba(239,68,68,0.1)';
              el.style.borderColor = 'rgba(239,68,68,0.3)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.color = 'var(--text-muted)';
              el.style.background = 'var(--bg-inset)';
              el.style.borderColor = 'var(--border-default)';
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}
