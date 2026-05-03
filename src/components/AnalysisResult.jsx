import React from 'react';

const AnalysisResult = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
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
      <div className="glass-card">
        <p style={{ color: 'var(--primary)' }}>Analysis received but in unexpected format:</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', opacity: 0.8 }}>{analysis}</pre>
      </div>
    );
  }

  const StatBox = ({ label, value, confidence }) => (
    <div className="stat-item" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
      <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{value || 'Unknown'}</p>
      {confidence !== undefined && confidence !== null && (
        <div style={{ marginTop: '8px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${confidence}%`, height: '100%', background: 'var(--primary)' }}></div>
        </div>
      )}
    </div>
  );

  const EvaluationCard = ({ title, evaluation }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h4>
        <span style={{ 
          padding: '4px 10px', 
          borderRadius: '20px', 
          fontSize: '0.75rem', 
          fontWeight: '700',
          background: evaluation?.quality_rating === 'Good' ? 'rgba(0, 255, 136, 0.1)' : evaluation?.quality_rating === 'Poor' ? 'rgba(255, 50, 50, 0.1)' : 'rgba(255, 255, 255, 0.1)',
          color: evaluation?.quality_rating === 'Good' ? 'var(--primary)' : evaluation?.quality_rating === 'Poor' ? '#ff4d4d' : 'var(--text)'
        }}>
          {evaluation?.quality_rating || 'N/A'}
        </span>
      </div>
      <p style={{ fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>{evaluation?.reasoning}</p>
      <div style={{ padding: '10px 14px', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Pro Tip</p>
        <p style={{ fontSize: '0.85rem', margin: 0 }}>{evaluation?.suggestion}</p>
      </div>
    </div>
  );

  return (
    <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
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
        <StatBox label="Control Status" value={data.outcome_stats?.control_status} />
        <StatBox label="Visible Result" value={data.outcome_stats?.visible_result} confidence={data.outcome_stats?.confidence} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Delivery Data</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Length: <strong style={{ color: 'var(--text)' }}>{data.delivery_data?.length}</strong></p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Line: <strong style={{ color: 'var(--text)' }}>{data.delivery_data?.line}</strong></p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Movement: <strong style={{ color: 'var(--text)' }}>{data.delivery_data?.deviation}</strong></p>
          </div>
        </div>
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Biomechanics</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Head: <strong style={{ color: 'var(--text)' }}>{data.biomechanics_impact?.head_alignment}</strong></p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Trigger: <strong style={{ color: 'var(--text)' }}>{data.biomechanics_impact?.trigger_movement}</strong></p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Angle: <strong style={{ color: 'var(--text)' }}>{data.biomechanics_impact?.launch_angle}</strong></p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <EvaluationCard title="Batter Evaluation" evaluation={data.evaluation_and_feedback?.batter} />
        <EvaluationCard title="Bowler Evaluation" evaluation={data.evaluation_and_feedback?.bowler} />
      </div>

      <div style={{ background: 'rgba(0, 180, 216, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0, 180, 216, 0.1)', marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Observations</h4>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {data.observations?.map((obs, i) => (
            <li key={i} style={{ fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>{obs}</li>
          ))}
        </ul>
      </div>
      
      {data.characteristics && data.characteristics !== 'Unknown' && (
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center' }}>
            {data.characteristics}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisResult;
