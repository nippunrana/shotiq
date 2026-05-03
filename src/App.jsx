import React from 'react'
import VideoUploader from './components/VideoUploader'

function App() {
  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1>Cricket Shot Analyzer</h1>
        <p className="subtitle">
          Upload your batting clips to get deep technical analysis powered by Google Gemini AI. 
          Perfect your stance, timing, and execution.
        </p>
      </header>

      <main style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <VideoUploader />
      </main>

      <footer style={{ marginTop: 'auto', padding: '4rem 0 2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        <p>© 2026 ShotIQ. Precision Analysis for the Modern Game.</p>
      </footer>
    </div>
  )
}

export default App

