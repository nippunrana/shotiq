/**
 * ShotIQ | Pure Vanilla AI
 * 100% Build-less. 100% Framework-less. 100% Direct.
 */

// --- CONFIGURATION ---
let API_KEY = localStorage.getItem('shotiq_api_key') || '';
const SAMPLE_VIDEO_URL = "https://firebasestorage.googleapis.com/v0/b/shotiq-eb03a.firebasestorage.app/o/videos%2F1777807311264_WhatsApp%20Video%202026-05-03%20at%2016.22.51.mp4?alt=media&token=809168e9-8b88-4630-bbae-a10e297964c5";

const CRICKET_ANALYSIS_PROMPT = `
Role: You are an expert Cricket Analyst and Data Scientist.

Task: Analyze the provided cricket video or image and return insights that go beyond basic score/speed commentary. Break the play into four layers:
1. Categorization: What happened.
2. Execution: How it happened.
3. Data Metrics: Hidden physical and technical signals.
4. Evaluation & Feedback: Is it a good or poor execution, why, and how to improve.

Rules:
- Use only evidence visible in the input. Do not guess match outcomes (e.g., Wicket/Boundary) unless the fielder or boundary is clearly visible.
- If a string field cannot be confidently inferred from the media, return the exact string "Unknown".
- If a numerical field cannot be confidently inferred, return null (do not return "Unknown" for numbers to prevent JSON type errors).
- If the input is an image, analyze only the static pose at the moment of capture. Dynamically dependent fields (like trigger movement or deviation) must be set to "Unknown" or null.
- If the input is a video, analyze motion, timing, and impact.
- All confidence scores must be integers between 0 and 100 (do not include the '%' symbol).

Analysis Requirements:
Categorization: Identify the formal coaching name and, if applicable, the colloquial/fan name (e.g., Cover Drive, Helicopter Shot).

Execution & Biomechanics: Assess batter head stability, trigger movement, bat path, footwork, and follow-through based strictly on body kinematics.

Ball-Tracking & Impact: Estimate delivery length, line, deviation, and contact quality (Sweet spot/Edge/Miss).

Evaluation & Feedback: Grade both the batter and the bowler independently based ONLY on visual biomechanics, ball impact, and pitching location.
- For the batter: Evaluate their shot execution, footwork, and biomechanics. Provide a grade, reason, and coaching suggestion.
- For the bowler: Evaluate their line, length, and the difficulty of the delivery. Provide a grade, reason, and a strategic suggestion (e.g., "bowl a shorter length", "change line to 5th stump").

Output Format: Strict JSON only. Do not include markdown formatting, markdown code blocks (\`\`\`json), or explanations outside the JSON.

  {
    "shot_type_mechanical": "Formal coaching name or Unknown",
    "shot_type_colloquial": "Popular/fan name or Unknown",
    "direction": "Field region (e.g., Mid-wicket, Long-on) or Unknown",
    "characteristics": "Brief description of footwork, bat path, and follow-through or Unknown",
    "overall_confidence": 0,
    "delivery_data": {
      "length": "Yorker/Full/Good/Short/Unknown",
      "line": "Off/Middle/Leg/Unknown",
      "deviation": "Swing/Spin/Straight/Unknown",
      "confidence": 0
  },
    "biomechanics_impact": {
      "trigger_movement": "Footwork description or Unknown",
      "head_alignment": "Stable/Falling off/Unknown",
      "contact_quality": "Sweet spot/Edge/Miss/Unknown",
      "launch_angle": "Grounded/Lofted/Aerial/Unknown",
      "confidence": 0
  },
    "outcome_stats": {
      "control_status": "In Control/Not In Control/Unknown",
      "visible_result": "Boundary/Wicket/Dot/Runs/Unknown",
      "confidence": 0
  },
    "evaluation_and_feedback": {
      "batter": {
        "quality_rating": "Good/Average/Poor/Unknown",
        "reasoning": "Explanation of the batter's execution (e.g., 'Perfect weight transfer' or 'Played away from the body').",
        "suggestion": "Advice for the batter (e.g., 'Maintain head position' or 'Play straighter')."
    },
      "bowler": {
        "quality_rating": "Good/Average/Poor/Unknown",
        "reasoning": "Explanation of the delivery's quality (e.g., 'Bowled a half-volley allowing an easy drive' or 'Hit a perfect heavy length').",
        "suggestion": "Advice for the bowler (e.g., 'Pull the length back by 2 meters' or 'Aim for the 5th stump line')."
    }
    },
    "observations": [
    "Short sentences explaining hidden technical insights not obvious from standard coverage, such as a delayed trigger or bat-face closure."
  ]
}
`;

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

// Initialize API Key input
if (API_KEY) apiKeyInput.value = API_KEY;

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
    if (!API_KEY) {
        alert('Please configure your Gemini API Key first.');
        apiPanel.classList.add('active');
        return;
    }
    
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
        apiPanel.classList.remove('active');
    } else {
        alert('Please enter a valid API Key.');
    }
};

// --- LOGIC ---
async function handleFile(file) {
    if (!API_KEY) {
        alert('Please configure your Gemini API Key first (click the gear icon in the top right).');
        apiPanel.classList.add('active');
        fileInput.value = ''; // Reset file input
        return;
    }

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

        const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            throw new Error(data.error?.message || "API Error");
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
