import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function MathRenderer({ math, content, block: forceBlock = false }) {
  const rawContent = (math || content || "").toString().replace(/\\n/g, '\n');

  // Split by $$...$$ or $...$
  const parts = rawContent.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  const renderText = (text) => {
    if (!text.trim() && text !== '\n') return null;

    // Basic Markdown transformations
    let processed = text;
    
    // Headers: ### Topic -> <h3>Topic</h3>
    if (processed.startsWith('###')) {
      return <h3 className="board-h3">{processed.replace(/^###\s*/, '')}</h3>;
    }
    if (processed.startsWith('##')) {
      return <h2 className="board-h2">{processed.replace(/^##\s*/, '')}</h2>;
    }

    // Paragraph splitting
    return processed.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < processed.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="math-renderer-root">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const expression = part.slice(2, -2);
          return <BlockMath key={index} math={expression || " "} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const expression = part.slice(1, -1);
          return <InlineMath key={index} math={expression || " "} />;
        } else {
          return <span key={index}>{renderText(part)}</span>;
        }
      })}
    </div>
  );
}
