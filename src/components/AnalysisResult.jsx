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

  let data;
  try {
    // Handle potential markdown code blocks in response
    const jsonStr = analysis.replace(/```json\n?|```/g, '').trim();
    data = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse analysis JSON:", e);
    return (
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <p style={{ color: 'var(--primary)' }}>Analysis received but in unexpected format:</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', opacity: 0.8 }}>{analysis}</pre>
      </div>
    );
  }

  const StatBox = ({ label, value, confidence }) => (
    <div className="stat-item" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
      <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{value || 'Unknown'}</p>
      {confidence !== undefined && (
        <div style={{ marginTop: '8px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${confidence}%`, height: '100%', background: 'var(--primary)' }}></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="glass-card" style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>⚡</div>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{data.shot_type_colloquial}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{data.shot_type_mechanical}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Overall Confidence</p>
          <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>{data.overall_confidence}%</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatBox label="Direction" value={data.direction} />
        <StatBox label="Impact Quality" value={data.biomechanics_impact?.contact_quality} confidence={data.biomechanics_impact?.confidence} />
        <StatBox label="Power Rating" value={`${data.outcome_stats?.power_rating_1_to_10}/10`} />
        <StatBox label="Control" value={`${data.outcome_stats?.control_percentage}%`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--primary)' }}>Delivery Data</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem' }}>Length: <strong>{data.delivery_data?.length}</strong></p>
            <p style={{ fontSize: '0.9rem' }}>Line: <strong>{data.delivery_data?.line}</strong></p>
            <p style={{ fontSize: '0.9rem' }}>Movement: <strong>{data.delivery_data?.deviation}</strong></p>
          </div>
        </div>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--primary)' }}>Biomechanics</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem' }}>Head: <strong>{data.biomechanics_impact?.head_alignment}</strong></p>
            <p style={{ fontSize: '0.9rem' }}>Trigger: <strong>{data.biomechanics_impact?.trigger_movement}</strong></p>
            <p style={{ fontSize: '0.9rem' }}>Angle: <strong>{data.biomechanics_impact?.launch_angle}</strong></p>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(0, 180, 216, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0, 180, 216, 0.1)' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--primary)' }}>Technical Observations</h4>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {data.observations?.map((obs, i) => (
            <li key={i} style={{ fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>{obs}</li>
          ))}
        </ul>
      </div>
      
      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
        {data.characteristics}
      </p>
    </div>
  );
};

export default AnalysisResult;
