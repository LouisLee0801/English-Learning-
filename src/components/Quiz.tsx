import { useState } from 'react';
import type { QuizQuestion } from '../data/types';
import { getUnitProgress, updateUnitProgress } from '../lib/progress';

export default function Quiz({ unitId, questions }: { unitId: string; questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const best = getUnitProgress(unitId).bestQuizScore;

  if (questions.length === 0) return <p>此單元尚無測驗。</p>;

  const q = questions[index];

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  };

  const nextQuestion = () => {
    if (index + 1 >= questions.length) {
      const finalCorrect = correct;
      const score = Math.round((finalCorrect / questions.length) * 100);
      updateUnitProgress(unitId, {
        quizTaken: true,
        bestQuizScore: Math.max(best, score),
      });
      setFinished(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
  };

  if (finished) {
    const score = Math.round((correct / questions.length) * 100);
    return (
      <div className="quiz-result">
        <div className="score-circle">{score}<span>分</span></div>
        <p>
          {score >= 90 && '太強了！這個情境你已經可以出國實戰了 🎉'}
          {score >= 70 && score < 90 && '不錯！再複習一下錯的題目就完美了 👍'}
          {score < 70 && '再多看看對話和句型，然後回來挑戰一次 💪'}
        </p>
        {score >= 70 && <p className="unit-complete-note">✓ 本單元已標記完成</p>}
        <button className="btn-primary" onClick={restart}>再測一次</button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        第 {index + 1} / {questions.length} 題
        {best > 0 && <span className="best-score">最佳成績 {best} 分</span>}
      </div>
      <h3 className="quiz-question">{q.question}</h3>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'quiz-option';
          if (selected !== null) {
            if (i === q.answer) cls += ' correct';
            else if (i === selected) cls += ' wrong';
            else cls += ' disabled';
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="quiz-explanation">
          <p>{selected === q.answer ? '✅ 答對了！' : '❌ 不對喔。'} {q.explanation}</p>
          <button className="btn-primary" onClick={nextQuestion}>
            {index + 1 >= questions.length ? '看成績' : '下一題 →'}
          </button>
        </div>
      )}
    </div>
  );
}
