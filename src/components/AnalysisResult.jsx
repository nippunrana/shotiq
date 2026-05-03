import React from 'react';

const AnalysisResult = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem' }}>
        <div className="loader" style={{ margin: '0 auto 1.5rem' }}></div>
        <h3>Gemini 3 Flash is Thinking...</h3>
        <p style={{ color: 'var(--text-dim)' }}>Processing video frames and analyzing technical nuances.</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="glass-card" style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem', marginRight: '10px' }}>🤖</div>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Technical Breakdown</h2>
      </div>
      
      <div className="analysis-content" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.9)' }}>
        {/* Simple markdown-ish rendering */}
        {analysis.split('\n').map((line, i) => {
          if (line.startsWith('# ')) return <h1 key={i}>{line.substring(2)}</h1>;
          if (line.startsWith('## ')) return <h2 key={i} style={{ marginTop: '1.5rem', color: 'var(--primary)' }}>{line.substring(3)}</h2>;
          if (line.startsWith('### ')) return <h3 key={i} style={{ marginTop: '1rem' }}>{line.substring(4)}</h3>;
          if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
          if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>{line.substring(2)}</li>;
          if (line.trim() === '') return <br key={i} />;
          
          // Handle bold text within lines
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={i} style={{ marginBottom: '0.8rem' }}>
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} style={{ color: 'var(--primary)' }}>{part.replace(/\*\*/g, '')}</strong>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisResult;
