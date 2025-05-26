import React, { useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import useLanguageTool from "@/hooks/useLanguageTool";
import Tooltip from "@mui/material/Tooltip";

function getAnnotatedText(text, matches) {
  if (!matches || matches.length === 0) return [text];
  // Sort matches by offset
  const sorted = [...matches].sort((a, b) => a.offset - b.offset);
  let result = [];
  let lastIndex = 0;
  sorted.forEach((m, i) => {
    if (m.offset > lastIndex) {
      result.push(text.slice(lastIndex, m.offset));
    }
    const errorText = text.slice(m.offset, m.offset + m.length);
    result.push(
      <Tooltip
        key={i + "-tooltip"}
        title={
          m.message +
          (m.replacements?.length
            ? `\nSuggestions: ${m.replacements.map((r) => r.value).join(", ")}`
            : "")
        }
        arrow
        placement="top"
      >
        <span
          style={{
            textDecoration: "underline wavy",
            textDecorationColor: "#ffb3b3",
            backgroundColor: "rgba(255,0,0,0.04)",
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          {errorText}
        </span>
      </Tooltip>
    );
    lastIndex = m.offset + m.length;
  });
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  return result;
}

export default function ProofreadTextField({
  value,
  onChange,
  language = "en-US",
  ...props
}) {
  const { matches, loading } = useLanguageTool(value, language);
  const editableRef = useRef();

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        style={{
          minHeight: 120,
          border: "1px solid #e0e0e0",
          borderRadius: 4,
          padding: 16,
          background: "#fff",
          fontSize: 16,
          outline: "none",
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
        }}
        onInput={(e) =>
          onChange &&
          onChange({ target: { value: e.currentTarget.textContent } })
        }
        spellCheck={false}
        aria-label={props.label || "Proofread text field"}
      >
        {getAnnotatedText(value, matches)}
      </div>
      {loading && (
        <span
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "#aaa",
            fontSize: 12,
          }}
        >
          Checking...
        </span>
      )}
    </div>
  );
}
