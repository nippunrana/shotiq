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

sampleBtn.onclick = () => {
    window.open(SAMPLE_VIDEO_URL, '_blank');
    alert("Sample video opened. Download and upload it here!");
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
    analysisContent.innerHTML = '';

    try {
        const base64 = await fileToBase64(file);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze this cricket shot: " + CRICKET_ANALYSIS_PROMPT },
                        { inline_data: { mime_type: file.type, data: base64 } }
                    ]
                }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "API Error");

        const analysis = JSON.parse(data.candidates[0].content.parts[0].text);
        renderData(analysis);
        
    } catch (err) {
        analysisContent.innerHTML = `<p style="color:#ff4b4b">Error: ${err.message}</p>`;
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
    // Elegant JSON to HTML rendering
    analysisContent.innerHTML = `
        <h2>${data.shot_type_mechanical} (${data.shot_type_colloquial})</h2>
        <p><strong>Direction:</strong> ${data.direction}</p>
        <p><strong>Impact:</strong> ${data.biomechanics_impact.contact_quality} (${data.biomechanics_impact.launch_angle})</p>
        
        <div style="margin-top:2rem">
            <h3>Batter Feedback</h3>
            <p>${data.evaluation_and_feedback.batter.reasoning}</p>
            <p><em>Pro Tip: ${data.evaluation_and_feedback.batter.suggestion}</em></p>
        </div>

        <div style="margin-top:2rem">
            <h3>Bowler Feedback</h3>
            <p>${data.evaluation_and_feedback.bowler.reasoning}</p>
        </div>
    `;
}
