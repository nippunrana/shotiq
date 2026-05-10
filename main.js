/**
 * ShotIQ | Pure Vanilla AI
 * 100% Build-less. 100% Framework-less. 100% Direct.
 */

// --- CONFIGURATION ---
const API_ENDPOINT = 'api/index.php';
let API_KEY = localStorage.getItem('shotiq_api_key') || '';
let API_SOURCE = localStorage.getItem('shotiq_api_source') || 'server';
const SAMPLE_VIDEO_URL = "https://firebasestorage.googleapis.com/v0/b/shotiq-eb03a.firebasestorage.app/o/videos%2F1777807311264_WhatsApp%20Video%202026-05-03%20at%2016.22.51.mp4?alt=media&token=809168e9-8b88-4630-bbae-a10e297964c5";

// (CRICKET_ANALYSIS_PROMPT is now loaded from prompts.js)


// --- DOM ELEMENTS ---
const uploadSection = document.getElementById('upload-section');
const resultsSection = document.getElementById('results-section');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const videoPreview = document.getElementById('video-preview');
const resetBtn = document.getElementById('reset-btn');
const sampleBtn = document.getElementById('sample-btn');
const loadingState = document.getElementById('loading-state');
const analysisContent = document.getElementById('analysis-content');

// API Config Elements
const settingsToggle = document.getElementById('settings-toggle');
const apiPanel = document.getElementById('api-panel');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiBtn = document.getElementById('save-api-btn');
const clearApiBtn = document.getElementById('clear-api-btn');
const serverKeyDisplay = document.getElementById('server-key-display');
const browserKeyDisplay = document.getElementById('browser-key-display');
const sourceRadios = document.getElementsByName('api-source');

// Initialize API Key input and status
if (API_KEY) apiKeyInput.value = API_KEY;

// Set initial radio
sourceRadios.forEach(r => {
    if (r.value === API_SOURCE) r.checked = true;
    r.onchange = (e) => {
        API_SOURCE = e.target.value;
        localStorage.setItem('shotiq_api_source', API_SOURCE);
    };
});

updateApiStatus();

// --- EVENTS ---
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => e.target.files[0] && handleFile(e.target.files[0]);

resetBtn.onclick = () => {
    resultsSection.classList.remove('active');
    uploadSection.classList.add('active');
    videoPreview.src = '';
    analysisContent.innerHTML = '';
};

sampleBtn.onclick = async () => {
    try {
        loadingState.classList.remove('hidden');
        const response = await fetch(SAMPLE_VIDEO_URL);
        const blob = await response.blob();
        const file = new File([blob], "sample_cricket.mp4", { type: "video/mp4" });
        handleFile(file);
    } catch (err) {
        alert("Failed to load sample video: " + err.message);
    }
};

// --- API CONFIG EVENTS ---
settingsToggle.onclick = (e) => {
    e.stopPropagation();
    apiPanel.classList.toggle('active');
};

document.addEventListener('click', (e) => {
    if (!apiPanel.contains(e.target) && e.target !== settingsToggle) {
        apiPanel.classList.remove('active');
    }
});

saveApiBtn.onclick = () => {
    const newKey = apiKeyInput.value.trim();
    if (newKey) {
        API_KEY = newKey;
        localStorage.setItem('shotiq_api_key', newKey);
        alert('API Key saved successfully!');
        updateApiStatus();
        apiPanel.classList.remove('active');
    } else {
        alert('Please enter a valid API Key.');
    }
};

clearApiBtn.onclick = () => {
    if (confirm('Clear the browser-stored API key?')) {
        API_KEY = '';
        localStorage.removeItem('shotiq_api_key');
        apiKeyInput.value = '';
        alert('Browser API Key cleared.');
        updateApiStatus();
    }
};

async function updateApiStatus() {
    // 1. Update Browser Key Display
    if (API_KEY) {
        browserKeyDisplay.textContent = '****' + API_KEY.slice(-4);
        document.getElementById('label-browser').classList.remove('disabled');
    } else {
        browserKeyDisplay.textContent = '****----';
        document.getElementById('label-browser').classList.add('disabled');
        // If current source is browser but no key, switch to server
        if (API_SOURCE === 'browser') {
            API_SOURCE = 'server';
            localStorage.setItem('shotiq_api_source', 'server');
            document.querySelector('input[value="server"]').checked = true;
        }
    }
    
    // 2. Fetch Server Status
    try {
        const response = await fetch(API_ENDPOINT);
        const data = await response.json();
        
        if (data.serverKeySet) {
            serverKeyDisplay.textContent = data.maskedKey;
            document.getElementById('label-server').classList.remove('disabled');
        } else {
            serverKeyDisplay.textContent = 'Not Configured';
            document.getElementById('label-server').classList.add('disabled');
            // Fallback selection
            if (API_SOURCE === 'server') {
                API_SOURCE = 'browser';
                localStorage.setItem('shotiq_api_source', 'browser');
                const browserRadio = document.querySelector('input[value="browser"]');
                if (browserRadio) browserRadio.checked = true;
            }
        }
    } catch (err) {
        serverKeyDisplay.textContent = 'Error Checking';
    }
}

// --- LOGIC ---
async function handleFile(file) {
    uploadSection.classList.remove('active');
    resultsSection.classList.add('active');
    videoPreview.src = URL.createObjectURL(file);
    videoPreview.play();
    
    await analyzeWithGemini(file);
}

async function analyzeWithGemini(file) {
    loadingState.classList.remove('hidden');
    const reasoningContainer = document.getElementById('analysis-reasoning');
    const actionButtons = document.getElementById('action-buttons');
    const downloadBtn = document.getElementById('download-btn');
    
    // Reset UI
    analysisContent.innerHTML = '';
    reasoningContainer.innerHTML = '';
    reasoningContainer.classList.add('hidden');
    actionButtons.classList.add('hidden');
    
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3')
    };

    const updateStep = (step, state) => {
        steps[step].className = state;
    };

    // Reset steps
    Object.values(steps).forEach(s => s.className = 'pending');

    try {
        // STEP 1: Prepare Video Data (Base64)
        updateStep(1, 'active');
        const base64 = await fileToBase64(file);
        updateStep(1, 'done');

        // STEP 2: Technical Reasoning
        updateStep(2, 'active');
        // Step 2 and 3 happen together in this mode
        updateStep(3, 'active');

        // Analysis request to PHP backend
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Gemini-API-Key': API_KEY,
                'X-Api-Source': API_SOURCE
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze this cricket shot with deep technical reasoning: " + CRICKET_ANALYSIS_PROMPT },
                        { 
                            inline_data: { mime_type: file.type, data: base64 }
                        }
                    ]
                }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    thinkingConfig: { 
                        includeThoughts: true,
                        thinkingLevel: "HIGH" 
                    }
                }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Gemini API Error Data:", data);
            
            // If the server tells us a key is required, open the settings panel
            if (data.error === 'API_KEY_REQUIRED') {
                alert('An API Key is required. Please enter one in the settings (gear icon) or configure the server .env file.');
                apiPanel.classList.add('active');
                throw new Error("API Key required");
            }
            
            throw new Error(data.error?.message || data.error || "API Error");
        }

        updateStep(2, 'done');
        updateStep(3, 'done');

        // STEP 4: Extract and Render Thoughts + Analysis
        const parts = data.candidates[0].content.parts;
        const thoughtPart = parts.find(p => p.thought === true);
        const textPart = parts.find(p => p.text && !p.thought);

        let reportText = "";

        if (thoughtPart) {
            reasoningContainer.innerHTML = `
                <div class="reasoning-header">🧠 AI Technical Reasoning</div>
                <div class="reasoning-body">${thoughtPart.text}</div>
            `;
            reasoningContainer.classList.remove('hidden');
            reportText += `TECHNICAL REASONING:\n${thoughtPart.text}\n\n`;
        }

        if (!textPart) {
            console.error("Response parts:", parts);
            throw new Error("No structured analysis returned by the model.");
        }

        const analysis = JSON.parse(textPart.text);
        renderData(analysis);
        reportText += `ANALYSIS REPORT:\n${JSON.stringify(analysis, null, 2)}`;

        // Setup Download
        actionButtons.classList.remove('hidden');
        downloadBtn.onclick = () => {
            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shotiq-analysis-${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        };
        
    } catch (err) {
        analysisContent.innerHTML = `<p style="color:#ff4b4b; background: rgba(255, 75, 75, 0.1); padding: 1rem; border-radius: 8px;">Error: ${err.message}</p>`;
    } finally {
        loadingState.classList.add('hidden');
    }
}

function fileToBase64(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
    });
}

function renderData(data) {
    const getRatingClass = (rating) => {
        const r = rating?.toLowerCase();
        if (r === 'good') return 'rating-good';
        if (r === 'average') return 'rating-average';
        if (r === 'poor') return 'rating-poor';
        return '';
    };

    const metrics = [
        { label: 'Direction', value: data.direction },
        { label: 'Length', value: data.delivery_data.length },
        { label: 'Line', value: data.delivery_data.line },
        { label: 'Impact', value: data.biomechanics_impact.contact_quality },
        { label: 'Angle', value: data.biomechanics_impact.launch_angle },
        { label: 'Control', value: data.outcome_stats.control_status }
    ];

    analysisContent.innerHTML = `
        <div class="analysis-header">
            <div class="shot-title-group">
                <div class="colloquial">${data.shot_type_colloquial}</div>
                <h2>${data.shot_type_mechanical}</h2>
            </div>
            <div class="confidence-badge">
                <span class="confidence-dot"></span>
                ${data.overall_confidence}% Confidence
            </div>
        </div>

        <div class="metrics-grid">
            ${metrics.map(m => `
                <div class="metric-card">
                    <div class="metric-label">${m.label}</div>
                    <div class="metric-value">${m.value}</div>
                </div>
            `).join('')}
        </div>

        <div class="evaluation-section">
            <div class="eval-card batter">
                <div class="eval-header">
                    <h3>Batter Feedback</h3>
                    <span class="rating-tag ${getRatingClass(data.evaluation_and_feedback.batter.quality_rating)}">
                        ${data.evaluation_and_feedback.batter.quality_rating}
                    </span>
                </div>
                <div class="eval-body">
                    <p>${data.evaluation_and_feedback.batter.reasoning}</p>
                    <div class="eval-suggestion">
                        <strong>Coach's Suggestion</strong>
                        ${data.evaluation_and_feedback.batter.suggestion}
                    </div>
                </div>
            </div>

            <div class="eval-card bowler">
                <div class="eval-header">
                    <h3>Bowler Feedback</h3>
                    <span class="rating-tag ${getRatingClass(data.evaluation_and_feedback.bowler.quality_rating)}">
                        ${data.evaluation_and_feedback.bowler.quality_rating}
                    </span>
                </div>
                <div class="eval-body">
                    <p>${data.evaluation_and_feedback.bowler.reasoning}</p>
                    <div class="eval-suggestion">
                        <strong>Strategic Adjustments</strong>
                        ${data.evaluation_and_feedback.bowler.suggestion}
                    </div>
                </div>
            </div>
        </div>

        <div class="observations-list">
            <h3>Technical Observations</h3>
            <ul>
                ${data.observations.map(obs => `<li>${obs}</li>`).join('')}
            </ul>
        </div>
    `;
}
