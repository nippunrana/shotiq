/**
 * ShotIQ | Pure Vanilla AI
 * 100% Build-less. 100% Framework-less. 100% Direct.
 */

// --- CONFIGURATION ---
const KEY_ENDPOINT = 'api/key.php';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent';


// (CRICKET_ANALYSIS_PROMPT is now loaded from prompts.js)


// --- DOM ELEMENTS ---
const welcomeView = document.getElementById('welcome-view');
const uploadView = document.getElementById('upload-view');
const analysisView = document.getElementById('analysis-view');

const startBtn = document.getElementById('start-btn');
const backToHomeBtn = document.getElementById('back-to-home');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const videoPreview = document.getElementById('video-preview');
const resetBtn = document.getElementById('reset-btn');
const sampleBtn = document.getElementById('sample-btn');
const loadingState = document.getElementById('loading-state');
const analysisContent = document.getElementById('analysis-content');



// --- VIEW MANAGEMENT ---
function switchView(viewElement) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    viewElement.classList.add('active');
}

// --- EVENTS ---
startBtn.onclick = () => switchView(uploadView);
backToHomeBtn.onclick = () => switchView(welcomeView);

dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => e.target.files[0] && handleFile(e.target.files[0]);

resetBtn.onclick = () => {
    switchView(uploadView);
    videoPreview.src = '';
    analysisContent.innerHTML = '';
};

sampleBtn.onclick = async () => {
    alert('Please upload your own cricket video clip to analyze.');
};



// --- LOGIC ---
async function handleFile(file) {
    switchView(analysisView);
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

        // STEP 2: Fetch API key from server
        updateStep(2, 'active');
        const keyRes = await fetch(KEY_ENDPOINT, { method: 'POST' });
        const keyData = await keyRes.json();
        if (!keyRes.ok || !keyData.key) {
            throw new Error(keyData.error || 'Failed to retrieve API key from server.');
        }
        const API_ENDPOINT = `${GEMINI_API_BASE}?key=${keyData.key}`;
        updateStep(2, 'done');

        // STEP 3: Call Gemini directly with the key
        updateStep(3, 'active');

        // Analysis request directly to Gemini
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
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
            
            if (data.error === 'API_KEY_REQUIRED') {
                alert('Server missing API configuration. Please configure the server environment variable.');
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
