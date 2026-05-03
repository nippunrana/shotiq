import React, { useState, useRef, useEffect } from 'react'
import VideoUploader from './components/VideoUploader'
import AnalysisResult from './components/AnalysisResult'
import { analyzeVideo } from './utils/gemini'

function App() {
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
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

  const handleSampleTest = async () => {
    const sampleUrl = "https://firebasestorage.googleapis.com/v0/b/shotiq-eb03a.firebasestorage.app/o/videos%2F1777807311264_WhatsApp%20Video%202026-05-03%20at%2016.22.51.mp4?alt=media&token=809168e9-8b88-4630-bbae-a10e297964c5";
    setLoadingSample(true);
    try {
      const response = await fetch(sampleUrl);
      if (!response.ok) throw new Error("Failed to fetch sample video");
      const blob = await response.blob();
      const file = new File([blob], "sample_video.mp4", { type: "video/mp4" });
      await handleUploadSuccess(file);
    } catch (error) {
      console.error("Sample video error:", error);
      alert("Could not load sample video. Please try uploading your own.");
    } finally {
      setLoadingSample(false);
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%' }}>
            <VideoUploader onUploadSuccess={handleUploadSuccess} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '2px' }}>OR</p>
              <button 
                onClick={handleSampleTest} 
                className="btn-secondary" 
                disabled={loadingSample}
                style={{ 
                  padding: '1rem 2.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  fontSize: '1.1rem',
                  borderWidth: '2px'
                }}
              >
                {loadingSample ? (
                  <>⏳ Preparing Sample...</>
                ) : (
                  <>🏏 Test with Sample Video</>
                )}
              </button>
            </div>
          </div>
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

