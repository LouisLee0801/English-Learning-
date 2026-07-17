import { useEffect, useState } from 'react';
import Home from './components/Home';
import UnitPage from './components/UnitPage';
import Coach from './components/Coach';

function parseRoute(hash: string): { page: 'home' | 'unit' | 'coach'; unitId?: string } {
  const h = hash.replace(/^#\/?/, '');
  if (h.startsWith('unit/')) return { page: 'unit', unitId: h.slice(5) };
  if (h === 'coach') return { page: 'coach' };
  return { page: 'home' };
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="app">
      <header className="site-header">
        <a href="#/" className="logo">
          <span className="logo-emoji">🇺🇸</span>
          <span>
            <strong>生活英語生存包</strong>
            <small>English Survival Kit</small>
          </span>
        </a>
        <nav>
          <a href="#/" className={route.page === 'home' ? 'active' : ''}>課程</a>
          <a href="#/coach" className={route.page === 'coach' ? 'active' : ''}>AI 陪練</a>
        </nav>
      </header>

      <main>
        {route.page === 'home' && <Home />}
        {route.page === 'unit' && route.unitId && <UnitPage unitId={route.unitId} />}
        {route.page === 'coach' && <Coach />}
      </main>

      <footer className="site-footer">
        目標：在國外用英文流暢生活 — 點餐、叫車、small talk、聽懂俚語，一站搞定 🎯
      </footer>
    </div>
  );
}
