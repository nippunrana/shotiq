import React, { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import AnalysisResult from './components/AnalysisResult'
import { analyzeVideo } from './utils/gemini'

function App() {
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleUploadSuccess = async (file) => {
    setAnalyzing(true);
    setAnalysis('');
    try {
      const result = await analyzeVideo(file);
      setAnalysis(result);
    } catch (error) {
      alert("Analysis failed: " + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1>Cricket Shot Analyzer</h1>
        <p className="subtitle">
          Upload your batting clips to get deep technical analysis powered by Google Gemini 3 Flash. 
          Perfect your stance, timing, and execution.
        </p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <VideoUploader onUploadSuccess={handleUploadSuccess} />
        
        {(analyzing || analysis) && (
          <div style={{ width: '100%', maxWidth: '800px' }}>
            <AnalysisResult analysis={analysis} loading={analyzing} />
          </div>
        )}
      </main>

      <footer style={{ marginTop: 'auto', padding: '4rem 0 2rem', color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center' }}>
        <p>© 2026 ShotIQ. Precision Analysis for the Modern Game.</p>
      </footer>
    </div>
  )
}

export default App

