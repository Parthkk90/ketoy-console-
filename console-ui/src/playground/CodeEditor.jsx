import React, { useRef, useEffect, useCallback } from 'react';
import { highlightDSL } from './highlighter';
import './CodeEditor.css';

/**
 * XCode-style code editor using textarea + pre overlay.
 * Provides syntax highlighting, line numbers, and keyboard shortcuts.
 */
export default function CodeEditor({ code, onChange, onRun }) {
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const containerRef = useRef(null);

  // Sync scroll between textarea and highlighted overlay
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Cmd/Ctrl + S → Run
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      onRun?.();
      return;
    }

    // Cmd/Ctrl + Enter → Run
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
      return;
    }

    // Tab → insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.slice(0, start) + '  ' + code.slice(end);
      onChange(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [code, onChange, onRun]);

  // Generate line numbers
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Get highlighted HTML
  const highlightedHTML = highlightDSL(code);

  return (
    <div className="code-editor" ref={containerRef}>
      {/* Line numbers gutter */}
      <div className="code-editor-gutter" ref={lineNumbersRef}>
        {lineNumbers.map(n => (
          <div key={n} className="code-editor-line-number">{n}</div>
        ))}
      </div>

      {/* Editor body */}
      <div className="code-editor-body">
        {/* Highlighted overlay */}
        <pre
          ref={preRef}
          className="code-editor-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedHTML + '\n' }}
        />

        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          className="code-editor-textarea"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          data-gramm="false"
        />
      </div>
    </div>
  );
}
