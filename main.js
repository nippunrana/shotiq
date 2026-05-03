/**
 * ShotIQ | Zero-Build Vanilla Logic
 * No frameworks, no build step, just clean JS.
 */

// --- Constants & Config ---
const PROXY_URL = 'https://YOUR_FIREBASE_FUNCTION_URL_HERE'; // Replace after deployment
const SAMPLE_VIDEO_URL = "https://firebasestorage.googleapis.com/v0/b/shotiq-eb03a.firebasestorage.app/o/videos%2F1777807311264_WhatsApp%20Video%202026-05-03%20at%2016.22.51.mp4?alt=media&token=809168e9-8b88-4630-bbae-a10e297964c5";

// --- DOM Elements ---
const uploadSection = document.getElementById('upload-section');
const resultsSection = document.getElementById('results-section');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const videoPreview = document.getElementById('video-preview');
const resetBtn = document.getElementById('reset-btn');
const sampleBtn = document.getElementById('sample-btn');
const loadingState = document.getElementById('loading-state');
const analysisContent = document.getElementById('analysis-content');

// --- Event Listeners ---

// File selection trigger
dropZone.addEventListener('click', () => fileInput.click());

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-primary)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--card-border)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

// Reset UI
resetBtn.addEventListener('click', () => {
    resultsSection.classList.remove('active');
    uploadSection.classList.add('active');
    videoPreview.src = '';
    analysisContent.innerHTML = '';
});

// Sample video
sampleBtn.addEventListener('click', () => {
    window.open(SAMPLE_VIDEO_URL, '_blank');
    alert("Sample video opened in a new tab. Download it and then upload it here to test analysis!");
});

// --- Core Logic ---

async function handleFile(file) {
    if (!file.type.startsWith('video/')) {
        alert("Please upload a valid video file.");
        return;
    }

    // Switch UI to Results
    uploadSection.classList.remove('active');
    resultsSection.classList.add('active');
    
    // Show Preview
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    videoPreview.play();

    // Start Analysis
    await analyzeVideo(file);
}

async function analyzeVideo(file) {
    loadingState.classList.remove('hidden');
    analysisContent.innerHTML = '';

    try {
        // Convert file to base64 for the proxy
        const base64 = await fileToBase64(file);
        const mimeType = file.type;

        // Call the Secure Proxy
        // NOTE: In a real Zero-Build app, you'd call your Firebase Function here.
        // For now, we simulate the fetch logic.
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                video: base64,
                mimeType: mimeType
            })
        });

        if (!response.ok) throw new Error("Failed to reach proxy. Make sure PROXY_URL is set correctly.");

        const data = await response.json();
        renderAnalysis(data.analysis);
        
    } catch (error) {
        console.error(error);
        analysisContent.innerHTML = `<div class="error-msg">
            <h3>Analysis Failed</h3>
            <p>${error.message}</p>
            <p style="font-size: 0.8rem; margin-top: 1rem;">Note: You need to deploy the Firebase Function proxy and update PROXY_URL in main.js to make this work.</p>
        </div>`;
    } finally {
        loadingState.classList.add('hidden');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

function renderAnalysis(markdown) {
    // A very simple markdown-ish renderer for the UI
    // In a real app, you could use a library like 'marked' from a CDN
    const html = markdown
        .replace(/^# (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
        
    analysisContent.innerHTML = html;
}
