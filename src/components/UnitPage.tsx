import { useEffect, useState } from 'react';
import { getUnit } from '../data';
import { updateUnitProgress } from '../lib/progress';
import DialogueView from './DialogueView';
import Flashcards from './Flashcards';
import Quiz from './Quiz';
import Videos from './Videos';

const TABS = ['對話', '單字卡', '句型', '影片', '測驗', '文化'] as const;
type Tab = (typeof TABS)[number];

export default function UnitPage({ unitId }: { unitId: string }) {
  const unit = getUnit(unitId);
  const [tab, setTab] = useState<Tab>('對話');

  useEffect(() => {
    if (unit) updateUnitProgress(unit.id, { visited: true });
  }, [unit]);

  if (!unit) {
    return (
      <div className="not-found">
        <p>找不到這個單元。</p>
        <a href="#/">← 回首頁</a>
      </div>
    );
  }

  return (
    <div className="unit-page">
      <div className="unit-header">
        <a href="#/" className="back-link">← 全部課程</a>
        <h1>
          <span className="unit-emoji-lg">{unit.emoji}</span> {unit.titleZh}
          <span className="unit-title-en">{unit.title}</span>
        </h1>
        <p className="tagline">{unit.tagline}</p>
      </div>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            {t}
            {t === '影片' && unit.videos.length > 0 && <sup>{unit.videos.length}</sup>}
          </button>
        ))}
      </nav>

      {tab === '對話' && <DialogueView dialogues={unit.dialogues} />}
      {tab === '單字卡' && <Flashcards unitId={unit.id} vocab={unit.vocab} />}
      {tab === '句型' && (
        <div className="phrase-list">
          <p className="section-hint">💬 這些句型可以直接背起來用，遇到情境直接套。</p>
          {unit.phrases.map((p, i) => (
            <div key={i} className="phrase-card">
              <div className="phrase-en">{p.en}</div>
              <div className="phrase-zh">{p.zh}</div>
              <div className="phrase-usage">{p.usage}</div>
            </div>
          ))}
        </div>
      )}
      {tab === '影片' && <Videos videos={unit.videos} />}
      {tab === '測驗' && <Quiz unitId={unit.id} questions={unit.quiz} />}
      {tab === '文化' && (
        <div className="culture-list">
          {unit.culture.map((c, i) => (
            <div key={i} className="culture-card">
              <h3>💡 {c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
