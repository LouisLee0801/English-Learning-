import { useState } from 'react';
import type { Dialogue } from '../data/types';

export default function DialogueView({ dialogues }: { dialogues: Dialogue[] }) {
  const [index, setIndex] = useState(0);
  const [showZh, setShowZh] = useState(true);
  const dialogue = dialogues[index];

  if (!dialogue) return <p>此單元尚無對話。</p>;

  return (
    <div className="dialogue-view">
      <div className="dialogue-controls">
        <div className="dialogue-picker">
          {dialogues.map((d, i) => (
            <button
              key={i}
              className={i === index ? 'chip active' : 'chip'}
              onClick={() => setIndex(i)}
            >
              {i + 1}. {d.titleZh}
            </button>
          ))}
        </div>
        <label className="toggle">
          <input type="checkbox" checked={showZh} onChange={(e) => setShowZh(e.target.checked)} />
          顯示中文
        </label>
      </div>

      <div className="scene-box">📍 {dialogue.scene}</div>

      <div className="dialogue-lines">
        {dialogue.lines.map((line, i) => {
          const isYou = /you|你/i.test(line.speaker);
          return (
            <div key={i} className={`line ${isYou ? 'line-you' : 'line-other'}`}>
              <span className="speaker">{line.speaker}</span>
              <div className="bubble">
                <div className="line-en">{line.en}</div>
                {showZh && <div className="line-zh">{line.zh}</div>}
                {line.note && <div className="line-note">📝 {line.note}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
