import { useState } from 'react';
import type { VocabItem } from '../data/types';
import { getUnitProgress, toggleKnownWord } from '../lib/progress';

export default function Flashcards({ unitId, vocab }: { unitId: string; vocab: VocabItem[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>(() => getUnitProgress(unitId).knownWords);
  const [listMode, setListMode] = useState(false);

  const card = vocab[index];
  if (!card) return <p>此單元尚無單字。</p>;

  const mark = (word: string) => {
    toggleKnownWord(unitId, word);
    setKnown(getUnitProgress(unitId).knownWords);
  };

  const next = () => {
    setFlipped(false);
    setIndex((index + 1) % vocab.length);
  };
  const prev = () => {
    setFlipped(false);
    setIndex((index - 1 + vocab.length) % vocab.length);
  };

  if (listMode) {
    return (
      <div className="vocab-list">
        <div className="vocab-toolbar">
          <span>{known.length}/{vocab.length} 已學會</span>
          <button className="btn-secondary" onClick={() => setListMode(false)}>🃏 卡片模式</button>
        </div>
        {vocab.map((v) => (
          <div key={v.word} className={`vocab-row ${known.includes(v.word) ? 'known' : ''}`}>
            <button className="know-btn" onClick={() => mark(v.word)} title="標記已學會">
              {known.includes(v.word) ? '✅' : '⬜'}
            </button>
            <div>
              <div className="vocab-word">
                {v.word} {v.ipa && <span className="ipa">/{v.ipa}/</span>}
                <span className="vocab-zh"> — {v.zh}</span>
              </div>
              <div className="vocab-example">{v.example}<span className="vocab-example-zh">（{v.exampleZh}）</span></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flashcards">
      <div className="vocab-toolbar">
        <span>{index + 1} / {vocab.length}・已學會 {known.length} 字</span>
        <button className="btn-secondary" onClick={() => setListMode(true)}>📋 列表模式</button>
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        {!flipped ? (
          <div className="card-face">
            <div className="card-word">{card.word}</div>
            {card.ipa && <div className="ipa">/{card.ipa}/</div>}
            <div className="card-hint">點擊看意思 👆</div>
          </div>
        ) : (
          <div className="card-face card-back">
            <div className="card-zh">{card.zh}</div>
            <div className="card-example">{card.example}</div>
            <div className="card-example-zh">{card.exampleZh}</div>
          </div>
        )}
      </div>

      <div className="card-actions">
        <button className="btn-secondary" onClick={prev}>← 上一張</button>
        <button
          className={known.includes(card.word) ? 'btn-known active' : 'btn-known'}
          onClick={() => mark(card.word)}
        >
          {known.includes(card.word) ? '✅ 已學會' : '學會了！'}
        </button>
        <button className="btn-secondary" onClick={next}>下一張 →</button>
      </div>
    </div>
  );
}
