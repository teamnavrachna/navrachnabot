import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useTheme } from '@/hooks/useTheme';
import { Onboarding } from '@/components/Onboarding';
import { Sidebar } from '@/components/Sidebar';
import type { Page } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Feed } from '@/components/Feed';
import { ActivityStreamPage } from '@/components/ActivityStreamPage';
import { ApprovedQueuePage } from '@/components/ApprovedQueuePage';
import { PublicationHistoryPage } from '@/components/PublicationHistoryPage';
import { SystemHealthPage } from '@/components/SystemHealthPage';
import { PersonaSettings } from '@/components/PersonaSettings';

const PAGE_WIDTHS: Record<Page, number> = {
  dashboard: 1200,
  feed: 1100,
  queue: 1200,
  activity: 1200,
  history: 1100,
  system: 1200,
  settings: 960,
};

export default function App() {
  const ctrl = useAppState();
  const { theme, toggle } = useTheme();
  const [page, setPageInternal] = useState<Page>(() => {
    return (sessionStorage.getItem('navarachna_active_page') as Page) || 'dashboard';
  });

  const setPage = (p: Page) => {
    sessionStorage.setItem('navarachna_active_page', p);
    setPageInternal(p);
  };

  if (!ctrl.state.persona) {
    return <Onboarding onCreate={ctrl.createPersona} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Background Subtle Mesh Grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header Navigation */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Sidebar
          page={page}
          setPage={setPage}
          persona={ctrl.state.persona}
          postCount={ctrl.state.posts.length}
          bookmarkCount={ctrl.state.bookmarks.length}
          onReset={ctrl.resetAll}
          theme={theme}
          onToggleTheme={toggle}
          ctrl={ctrl}
        />
      </div>

      {/* Main Canvas */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            maxWidth: PAGE_WIDTHS[page],
            margin: '0 auto',
            padding: '48px 32px 80px',
            transition: 'max-width 0.25s cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {page === 'dashboard' && <Dashboard ctrl={ctrl} />}
          {page === 'feed'      && <Feed ctrl={ctrl} />}
          {page === 'queue'     && <ApprovedQueuePage ctrl={ctrl} />}
          {page === 'activity'  && <ActivityStreamPage ctrl={ctrl} />}
          {page === 'history'   && <PublicationHistoryPage ctrl={ctrl} />}
          {page === 'system'    && <SystemHealthPage ctrl={ctrl} />}
          {page === 'settings'  && <PersonaSettings ctrl={ctrl} />}
        </div>
      </main>
    </div>
  );
}
