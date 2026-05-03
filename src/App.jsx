import React, { useState, useRef, useEffect } from 'react'
import VideoUploader from './components/VideoUploader'
import AnalysisResult from './components/AnalysisResult'
import { analyzeVideo } from './utils/gemini'

function App() {
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      // Force play when videoUrl is ready
      videoRef.current.play().catch(error => {
        console.warn("Autoplay failed, browser requires user interaction:", error);
      });
    }
  }, [videoUrl]);

  const handleUploadSuccess = async (file) => {
    // Create local URL to immediately play the video
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
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

  const handleReset = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setAnalysis('');
    setAnalyzing(false);
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

      <main className="main-content">
        {!videoUrl ? (
          <VideoUploader onUploadSuccess={handleUploadSuccess} />
        ) : (
          <div className="results-container">
            <div className="video-section glass-card">
              <div className="video-wrapper">
                <video 
                  ref={videoRef}
                  src={videoUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  controls 
                  controlsList="nodownload" 
                  className="video-player" 
                />
              </div>
              <button onClick={handleReset} className="btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }}>
                Upload Another Clip
              </button>
            </div>
            <div className="analysis-section">
              <AnalysisResult analysis={analysis} loading={analyzing} />
            </div>
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

