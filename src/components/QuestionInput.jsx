import { useState, useRef } from 'react';

const QuestionInput = ({ onSubmit, isLoading = false, onHome }) => {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    if (typeof onSubmit === 'function') onSubmit(trimmed);
    setQuestion('');
    setTimeout(() => textareaRef.current?.focus(), 20);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && question.trim()) handleSubmit();
    }
  };

  const canSubmit = !isLoading && question.trim() !== '';

  return (
    <div className="question-bar">
      <div className="question-bar__container">
        <form
          className="question-bar__inner"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="question-bar__toolbar">
            <label className="question-bar__label" htmlFor="board-question">
              Submit to the board
            </label>
            {onHome && (
              <button type="button" className="question-bar__home" onClick={onHome}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M2.5 6.5L8 2l5.5 4.5V13a1 1 0 01-1 1h-3.5v-4H7v4H3.5a1 1 0 01-1-1V6.5z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                Home
              </button>
            )}
          </div>

          <div className="question-bar__row">
            <div className="question-bar__field">
              <textarea
                id="board-question"
                ref={textareaRef}
                className="question-bar__textarea"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the decision or dilemma you need counsel on…"
                disabled={isLoading}
                rows={2}
              />
              <span className="question-bar__hint">
                <kbd>Enter</kbd> to submit · <kbd>Shift</kbd>+<kbd>Enter</kbd> for new line
              </span>
            </div>

            <button
              type="submit"
              className="question-bar__btn"
              disabled={!canSubmit}
            >
              {isLoading ? (
                <>
                  <span className="question-bar__spinner" aria-hidden />
                  Processing
                </>
              ) : (
                <>
                  Convene Board
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionInput;
