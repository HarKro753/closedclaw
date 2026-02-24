"use client";

import { useRef, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { Paperclip, ArrowUp } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  disabled: boolean;
}

const MAX_ROWS = 6;
const LINE_HEIGHT = 22;
const PADDING = 24;

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT * MAX_ROWS + PADDING;
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  function handleChange(val: string) {
    onChange(val);
    requestAnimationFrame(handleResize);
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div style={{ padding: "0 24px 24px", maxWidth: 768, margin: "0 auto", width: "100%" }}>
      <form
        onSubmit={onSubmit}
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "flex-end",
          padding: "8px 8px 8px 14px",
          gap: 8,
        }}
      >
        {/* Attach button */}
        <button
          type="button"
          className="hover-transition"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 4,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginBottom: 4,
          }}
          title="Attach file"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Paperclip size={18} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          data-testid="chat-input"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: 14,
            lineHeight: `${LINE_HEIGHT}px`,
            resize: "none",
            padding: "4px 0",
            maxHeight: LINE_HEIGHT * MAX_ROWS + PADDING,
            fontFamily: "inherit",
          }}
        />

        {/* Send button */}
        <button
          data-testid="send-button"
          type="submit"
          disabled={!canSend}
          className="hover-transition"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-full)",
            backgroundColor: canSend ? "var(--accent)" : "var(--bg-surface)",
            border: "none",
            color: canSend ? "#fff" : "var(--text-muted)",
            cursor: canSend ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 150ms ease, color 150ms ease, transform 100ms ease",
          }}
          onMouseDown={(e) => {
            if (canSend) e.currentTarget.style.transform = "scale(0.96)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <ArrowUp size={16} />
        </button>
      </form>
    </div>
  );
}
