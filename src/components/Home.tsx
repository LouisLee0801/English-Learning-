import { units, categories } from '../data';
import { getUnitProgress, isUnitComplete } from '../lib/progress';

export default function Home() {
  const completed = units.filter((u) => isUnitComplete(u.id)).length;

  return (
    <div className="home">
      <section className="hero">
        <h1>在國外，用英文流暢生活 🌎</h1>
        <p>
          不是商業英文，是<strong>真正用得到的日常英文</strong>：點餐、叫車、超市採買、
          small talk 接話、聽懂俚語。每個單元附真實影片、情境對話與中文解說。
        </p>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">{units.length}</span>
            <span className="stat-label">生活主題</span>
          </div>
          <div className="stat">
            <span className="stat-num">{completed}</span>
            <span className="stat-label">已完成（測驗 70 分以上）</span>
          </div>
          <div className="stat">
            <span className="stat-num">{units.reduce((n, u) => n + u.vocab.length, 0)}</span>
            <span className="stat-label">實用單字</span>
          </div>
        </div>
      </section>

      {categories.map((cat) => {
        const catUnits = units.filter((u) => u.category === cat);
        if (catUnits.length === 0) return null;
        return (
          <section key={cat} className="category-section">
            <h2>{cat}</h2>
            <div className="unit-grid">
              {catUnits.map((u) => {
                const p = getUnitProgress(u.id);
                const done = isUnitComplete(u.id);
                return (
                  <a key={u.id} href={`#/unit/${u.id}`} className={`unit-card ${done ? 'done' : ''}`}>
                    <div className="unit-emoji">{u.emoji}</div>
                    <div className="unit-info">
                      <h3>{u.titleZh}</h3>
                      <span className="unit-en">{u.title}</span>
                      <p>{u.tagline}</p>
                    </div>
                    <div className="unit-badges">
                      {done && <span className="badge badge-done">✓ 完成</span>}
                      {!done && p.visited && <span className="badge">學習中</span>}
                      {p.knownWords.length > 0 && (
                        <span className="badge badge-words">{p.knownWords.length} 字已學會</span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="coach-promo">
        <h2>🤖 AI 對話陪練</h2>
        <p>
          學完課程後，跟 AI 實戰演練：AI 扮演服務生、司機、派對上的陌生人，陪你用英文對話，
          並用中文即時講評你的說法自不自然。
        </p>
        <a href="#/coach" className="btn-primary">開始陪練 →</a>
      </section>
    </div>
  );
}
