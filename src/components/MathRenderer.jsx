import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { NumberLine, CounterSet, GeometricShape } from './MathVisuals';

export default function MathRenderer({ math, content, block: forceBlock = false, onInteract }) {
  const rawContent = (math || content || "").toString().replace(/\\n/g, '\n');

  // Intercept Visual Graphs [GRAPH: type=..., key=val]
  const parseGraph = (tag) => {
    try {
      const content = tag.slice(7, -1); // Remove [GRAPH: and ]
      const params = {};
      content.split(',').forEach(p => {
        const [k, v] = p.split('=').map(s => s.trim());
        if (k && v) params[k] = v;
      });

      const isInteractive = params.interactive === 'true';

      switch (params.type) {
        case 'numberline':
          return <NumberLine 
            min={parseInt(params.min || 0)} 
            max={parseInt(params.max || 10)} 
            highlight={params.highlight ? parseFloat(params.highlight) : null}
            marks={params.marks ? params.marks.split('|').map(Number) : []}
          />;
        case 'counters':
          return <CounterSet 
            id={params.id || `c_${Math.random().toString(36).substr(2, 5)}`}
            count={parseInt(params.count || 0)} 
            grouping={parseInt(params.grouping || 5)}
            icon={params.icon || 'apple'}
            interactive={isInteractive}
            onInteract={onInteract}
          />;
        case 'shape':
          return <GeometricShape 
            type={params.shape || 'triangle'} 
            labels={params.labels ? params.labels.split('|') : []}
          />;
        default:
          return null;
      }
    } catch (e) {
      console.error("Graph parse error:", e);
      return null;
    }
  };

  // Split by [GRAPH:...] OR $$...$$ OR $...$
  const parts = rawContent.split(/(\[GRAPH:.*?\]|\$\$.*?\$\$|\$.*?\$)/g);

  const renderText = (text) => {
    if (!text.trim() && text !== '\n') return null;

    let processed = text;
    if (processed.startsWith('###')) {
      return <h3 className="board-h3">{processed.replace(/^###\s*/, '')}</h3>;
    }
    if (processed.startsWith('##')) {
      return <h2 className="board-h2">{processed.replace(/^##\s*/, '')}</h2>;
    }

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
        if (part.startsWith('[GRAPH:')) {
          return <div key={index} className="visual-block-entry entry-animate">{parseGraph(part)}</div>;
        } else if (part.startsWith('$$') && part.endsWith('$$')) {
          const expression = part.slice(2, -2);
          return (
            <div key={index} className="math-block-wrapper entry-animate">
              <BlockMath math={expression || " "} />
            </div>
          );
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const expression = part.slice(1, -1);
          return <InlineMath key={index} math={expression || " "} />;
        } else {
          return <React.Fragment key={index}>{renderText(part)}</React.Fragment>;
        }
      })}
    </div>
  );
}
