import { useEffect, useRef, useState } from 'react';
import {
  scenarios,
  sendChat,
  getApiKey,
  setApiKey,
  type ChatMessage,
  type Scenario,
} from '../lib/ai';

export default function Coach() {
  const [hasKey, setHasKey] = useState(() => !!getApiKey());
  const [keyInput, setKeyInput] = useState('');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveKey = () => {
    setApiKey(keyInput);
    setHasKey(!!keyInput.trim());
    setKeyInput('');
  };

  const startScenario = (s: Scenario) => {
    setScenario(s);
    setMessages([{ role: 'assistant', content: s.opening }]);
    setError('');
  };

  const send = async () => {
    if (!input.trim() || loading || !scenario) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const reply = await sendChat(scenario, next);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '呼叫 API 失敗，請檢查 API key 與網路。');
    } finally {
      setLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="coach-setup">
        <h1>🤖 AI 對話陪練</h1>
        <p>
          這個模組讓 AI 扮演服務生、司機、派對上的陌生人，陪你實戰練英文對話，
          並在你講得不自然時用中文提點更道地的說法。
        </p>
        <div className="setup-card">
          <h3>啟用方式</h3>
          <ol>
            <li>到 <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com</a> 註冊並建立 API key</li>
            <li>把 key 貼在下面（只會存在你自己的瀏覽器裡，不會上傳到任何伺服器）</li>
          </ol>
          <div className="key-input-row">
            <input
              type="password"
              placeholder="sk-ant-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button className="btn-primary" onClick={saveKey} disabled={!keyInput.trim()}>
              啟用
            </button>
          </div>
          <p className="setup-note">
            ⚠️ 使用會產生 Anthropic API 費用（一般對話練習每次約幾美分）。
            不啟用也完全不影響課程內容的使用。
          </p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="coach-picker">
        <h1>🤖 選擇練習情境</h1>
        <p className="section-hint">
          AI 會全程用自然的美式口語跟你對話。卡住時可以直接打中文求救。
          <button
            className="link-btn"
            onClick={() => {
              setApiKey('');
              setHasKey(false);
            }}
          >
            （移除 API key）
          </button>
        </p>
        <div className="scenario-grid">
          {scenarios.map((s) => (
            <button key={s.id} className="scenario-card" onClick={() => startScenario(s)}>
              <span className="scenario-emoji">{s.emoji}</span>
              <h3>{s.titleZh}</h3>
              <p>{s.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="coach-chat">
      <div className="chat-header">
        <button className="btn-secondary" onClick={() => setScenario(null)}>← 換情境</button>
        <h2>{scenario.emoji} {scenario.titleZh}</h2>
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="chat-msg assistant typing">...</div>}
        {error && <div className="chat-error">⚠️ {error}</div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="用英文回覆…（卡住可以打中文求救）"
          disabled={loading}
        />
        <button className="btn-primary" onClick={send} disabled={loading || !input.trim()}>
          送出
        </button>
      </div>
    </div>
  );
}
