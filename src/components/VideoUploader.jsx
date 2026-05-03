import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../utils/firebase";

const VideoUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setDownloadURL(''); // Reset URL if new file selected
    } else {
      alert('Please select a valid video file.');
    }
  };

  const handleUpload = () => {
    if (!file) return;

    // Check if firebase config is still placeholder
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "YOUR_API_KEY") {
      alert("Please configure your Firebase credentials in the .env file first!");
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (error) => {
        console.error("Upload error:", error);
        setUploading(false);
        alert("Upload failed. Check console for details.");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          setUploading(false);
          console.log("File available at:", url);
          if (onUploadSuccess) {
            // Pass both the file (for local preview) and the storage path (for analysis)
            onUploadSuccess(file, storageRef.fullPath);
          }
        });
      }
    );
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
    }
  };

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '600px' }}>
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="video/*" 
          style={{ display: 'none' }}
        />
        {file ? (
          <div>
            <p style={{ color: 'var(--primary)', fontWeight: '600' }}>{file.name}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Click or drop another to change</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</div>
            <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>Drop your cricket shot here</p>
            <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>or click to browse files</p>
          </div>
        )}
      </div>

      {file && !uploading && !downloadURL && (
        <button 
          className="btn-primary" 
          onClick={(e) => { e.stopPropagation(); handleUpload(); }}
          style={{ width: '100%', marginTop: '2rem' }}
        >
          Upload to Storage
        </button>
      )}

      {uploading && (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Uploading... {Math.round(progress)}%</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {downloadURL && (
        <div className="file-link">
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '5px' }}>SUCCESS! Video URL:</p>
          <a href={downloadURL} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            {downloadURL}
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
