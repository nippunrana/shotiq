/**
 * ShotIQ | Premium AI Analytics Logic
 */

// --- CONFIGURATION ---
const KEY_ENDPOINT = 'api/key.php';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent';

// --- DOM ELEMENTS ---
const welcomeView = document.getElementById('welcome-view');
const uploadView = document.getElementById('upload-view');
const analysisView = document.getElementById('analysis-view');

const startBtn = document.getElementById('start-btn');
const backToHomeBtn = document.getElementById('back-to-home');

// Upload Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const sampleBtn = document.getElementById('sample-btn');

// Analysis Elements
const videoPreview = document.getElementById('video-preview');
const resetBtn = document.getElementById('reset-btn');
const loadingState = document.getElementById('loading-state');
const resultsSection = document.getElementById('results-section');
const accordionToggle = document.getElementById('reasoning-toggle');
const accordionBody = document.getElementById('reasoning-body');
const accordionWrap = document.getElementById('reasoning-accordion-wrap');
const toastContainer = document.getElementById('toast-container');

let rawAnalysisJSON = null;
let rawReasoningText = "";

// --- VIEW MANAGEMENT ---
function switchView(viewElement) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    viewElement.classList.add('active');
}

// --- EVENTS ---
startBtn.onclick = () => switchView(uploadView);
backToHomeBtn.onclick = () => switchView(welcomeView);

// Accordion Toggle
accordionToggle.onclick = () => {
    const isOpen = accordionWrap.classList.contains('open');
    if (isOpen) {
        accordionWrap.classList.remove('open');
        accordionBody.style.maxHeight = null;
    } else {
        accordionWrap.classList.add('open');
        accordionBody.style.maxHeight = accordionBody.scrollHeight + "px";
    }
};

// --- DRAG & DROP & FILE HANDLING ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelection(file);
});

dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    if (e.target.files[0]) handleFileSelection(e.target.files[0]);
};

function handleFileSelection(file) {
    // Validate
    if (!file.type.startsWith('video/')) {
        dropZone.classList.add('shake');
        setTimeout(() => dropZone.classList.remove('shake'), 400);
        showToast('Please upload a valid video file.', 'error');
        return;
    }

    // Show Preview in UI briefly before analyzing
    document.getElementById('upload-icon').style.display = 'none';
    document.getElementById('upload-heading').style.display = 'none';
    document.getElementById('upload-sub').style.display = 'none';
    
    fileName.textContent = file.name;
    fileSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    filePreview.classList.remove('hidden');

    // Proceed to analysis
    setTimeout(() => {
        startAnalysisFlow(file);
    }, 800);
}

resetBtn.onclick = () => {
    // Reset state
    switchView(uploadView);
    videoPreview.src = '';
    resultsSection.classList.add('hidden');
    
    // Reset Upload UI
    document.getElementById('upload-icon').style.display = 'block';
    document.getElementById('upload-heading').style.display = 'block';
    document.getElementById('upload-sub').style.display = 'block';
    filePreview.classList.add('hidden');
    fileInput.value = '';
};

sampleBtn.onclick = () => {
    showToast('Please upload your own cricket video to analyze.', 'info');
};

// --- TOAST SYSTEM ---
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- LOGIC ---
async function startAnalysisFlow(file) {
    switchView(analysisView);
    resultsSection.classList.add('hidden');
    loadingState.classList.remove('hidden');
    
    videoPreview.src = URL.createObjectURL(file);
    videoPreview.play();
    
    await analyzeWithGemini(file);
}

async function analyzeWithGemini(file) {
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3')
    };

    const updateStep = (step, state) => {
        steps[step].className = state;
    };

    Object.values(steps).forEach(s => s.className = 'pending');

    try {
        updateStep(1, 'active');
        const base64 = await fileToBase64(file);
        updateStep(1, 'done');

        updateStep(2, 'active');
        const keyRes = await fetch(KEY_ENDPOINT, { method: 'POST' });
        const keyData = await keyRes.json();
        if (!keyRes.ok || !keyData.key) {
            throw new Error(keyData.error || 'Failed to retrieve API key.');
        }
        const API_ENDPOINT = `${GEMINI_API_BASE}?key=${keyData.key}`;
        updateStep(2, 'done');

        updateStep(3, 'active');

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze this cricket shot with deep technical reasoning: " + CRICKET_ANALYSIS_PROMPT },
                        { inline_data: { mime_type: file.type, data: base64 } }
                    ]
                }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    thinkingConfig: { includeThoughts: true, thinkingLevel: "HIGH" }
                }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "API Error");
        }

        updateStep(3, 'done');

        const parts = data.candidates[0].content.parts;
        const thoughtPart = parts.find(p => p.thought === true);
        const textPart = parts.find(p => p.text && !p.thought);

        if (thoughtPart) {
            let cleanThought = thoughtPart.text;
            const jsonBlockIndex = cleanThought.indexOf("```json");
            if (jsonBlockIndex !== -1) {
                cleanThought = cleanThought.substring(0, jsonBlockIndex);
            }
            cleanThought = cleanThought.replace(/Here'?s (my summary|the output|my structured summary).*$/s, '');
            cleanThought = cleanThought.trim();

            document.getElementById('analysis-reasoning').textContent = cleanThought;
            rawReasoningText = cleanThought;
        }

        if (!textPart) throw new Error("No structured analysis returned.");

        rawAnalysisJSON = JSON.parse(textPart.text);
        
        loadingState.classList.add('hidden');
        renderPremiumUI(rawAnalysisJSON);
        
    } catch (err) {
        loadingState.classList.add('hidden');
        showToast(`Error: ${err.message}`, 'error');
        // Back to upload on error
        setTimeout(() => resetBtn.click(), 3000);
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

// --- RENDER ENGINE ---
function renderPremiumUI(data) {
    resultsSection.classList.remove('hidden');

    // 1. Hero Overlay Data
    document.getElementById('shot-colloquial').textContent = data.shot_type_colloquial;
    document.getElementById('shot-mechanical').textContent = data.shot_type_mechanical;
    
    // Pills
    const pillsHTML = [];
    if (data.direction && data.direction !== 'Unknown') pillsHTML.push(`<div class="pill">📍 ${data.direction}</div>`);
    if (data.outcome_stats.visible_result && data.outcome_stats.visible_result !== 'Unknown') pillsHTML.push(`<div class="pill">🏁 ${data.outcome_stats.visible_result}</div>`);
    document.getElementById('shot-pills').innerHTML = pillsHTML.join('');

    // Animate Ring
    animateRing(data.overall_confidence || 0);

    // 2. Metrics Grid
    const metricsGrid = document.getElementById('metrics-grid-new');
    const metrics = [
        { label: 'Length', value: data.delivery_data.length, icon: '📏' },
        { label: 'Line', value: data.delivery_data.line, icon: '🎯' },
        { label: 'Impact', value: data.biomechanics_impact.contact_quality, icon: '⚡' },
        { label: 'Control', value: data.outcome_stats.control_status, icon: '🎮' }
    ];

    metricsGrid.innerHTML = metrics.map((m, i) => `
        <div class="metric-card-pro" style="animation-delay: ${0.1 * i}s">
            <div class="metric-icon-wrap">${m.icon}</div>
            <div class="metric-label-pro">${m.label}</div>
            <div class="metric-value-pro">${m.value}</div>
            <div class="metric-bar"></div>
        </div>
    `).join('');

    // Trigger metric bar animations slightly after render
    setTimeout(() => {
        document.querySelectorAll('.metric-card-pro').forEach(card => {
            card.classList.add('animate-in');
            const bar = card.querySelector('.metric-bar');
            if (bar) bar.style.width = '100%';
        });
    }, 100);

    // 3. Eval Cards
    const evalGrid = document.getElementById('eval-section');
    const getRatingClass = (rating) => {
        const r = rating?.toLowerCase();
        if (r === 'good') return 'good';
        if (r === 'average') return 'average';
        if (r === 'poor') return 'poor';
        return '';
    };

    evalGrid.innerHTML = `
        <div class="eval-card-pro batter animate-in" style="animation-delay: 0.3s">
            <div class="eval-header-pro">
                <div class="eval-role"><span>🏏</span> Batter Analysis</div>
                <div class="rating-badge ${getRatingClass(data.evaluation_and_feedback.batter.quality_rating)}">
                    ${data.evaluation_and_feedback.batter.quality_rating}
                </div>
            </div>
            <p class="eval-reasoning">${data.evaluation_and_feedback.batter.reasoning}</p>
            <div class="eval-callout">
                <div class="eval-callout-title">💡 Coach's Suggestion</div>
                <div class="eval-callout-text">${data.evaluation_and_feedback.batter.suggestion}</div>
            </div>
        </div>

        <div class="eval-card-pro bowler animate-in" style="animation-delay: 0.4s">
            <div class="eval-header-pro">
                <div class="eval-role"><span>⚾</span> Bowler Analysis</div>
                <div class="rating-badge ${getRatingClass(data.evaluation_and_feedback.bowler.quality_rating)}">
                    ${data.evaluation_and_feedback.bowler.quality_rating}
                </div>
            </div>
            <p class="eval-reasoning">${data.evaluation_and_feedback.bowler.reasoning}</p>
            <div class="eval-callout">
                <div class="eval-callout-title">🎯 Strategic Adjustment</div>
                <div class="eval-callout-text">${data.evaluation_and_feedback.bowler.suggestion}</div>
            </div>
        </div>
    `;

    // 4. Timeline Observations
    const timeline = document.getElementById('timeline-section');
    if (data.observations && data.observations.length > 0) {
        timeline.innerHTML = `
            <div class="timeline-title">🔍 Technical Observations</div>
            <div class="timeline-list">
                ${data.observations.map((obs, i) => `
                    <div class="timeline-item animate-in" style="animation-delay: ${0.5 + (i * 0.1)}s">
                        <p>${obs}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 5. Action Buttons Setup
    document.getElementById('download-btn').onclick = downloadReport;
    document.getElementById('copy-json-btn').onclick = copyJSON;
    
    // Ensure accordion is closed
    accordionWrap.classList.remove('open');
    accordionBody.style.maxHeight = null;
}

function animateRing(confidence) {
    const ringValue = document.getElementById('ring-value');
    const ringArc = document.getElementById('ring-arc');
    
    const target = parseInt(confidence) || 0;
    
    // Animate Number
    let current = 0;
    const duration = 1500;
    const interval = 20;
    const step = (target / (duration / interval));
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        ringValue.textContent = Math.round(current);
    }, interval);

    // Animate SVG Arc
    // Circumference = 2 * pi * 50 = 314
    // Dashoffset: 314 = 0%, 0 = 100%
    setTimeout(() => {
        const offset = 314 - (314 * (target / 100));
        ringArc.style.strokeDashoffset = offset;
    }, 100);
}

// --- ACTIONS ---
function copyJSON() {
    if (!rawAnalysisJSON) return;
    navigator.clipboard.writeText(JSON.stringify(rawAnalysisJSON, null, 2))
        .then(() => showToast('JSON Copied to Clipboard!', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
}

async function downloadReport() {
    if (!rawAnalysisJSON) return;
    
    showToast('Generating PDF Report...', 'info');

    try {
        // 1. Capture Video Frame
        const canvas = document.createElement('canvas');
        canvas.width = videoPreview.videoWidth;
        canvas.height = videoPreview.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // 2. Populate Template
        document.getElementById('pdf-date').textContent = new Date().toLocaleDateString();
        document.getElementById('pdf-screenshot').src = frameDataUrl;
        document.getElementById('pdf-shot-name').textContent = rawAnalysisJSON.shot_type_mechanical || 'Shot Analysis';
        document.getElementById('pdf-shot-colloquial').textContent = rawAnalysisJSON.shot_type_colloquial || '';
        document.getElementById('pdf-reasoning-text').textContent = rawReasoningText || 'No technical reasoning provided.';

        // Populate Metrics
        const metrics = [
            { label: 'Length', value: rawAnalysisJSON.delivery_data?.length || '-' },
            { label: 'Line', value: rawAnalysisJSON.delivery_data?.line || '-' },
            { label: 'Impact', value: rawAnalysisJSON.biomechanics_impact?.contact_quality || '-' },
            { label: 'Control', value: rawAnalysisJSON.outcome_stats?.control_status || '-' }
        ];
        document.getElementById('pdf-metrics').innerHTML = metrics.map(m => `
            <div class="pdf-metric-card">
                <div class="pdf-metric-label">${m.label}</div>
                <div class="pdf-metric-value">${m.value}</div>
            </div>
        `).join('');

        // Populate Evals
        const getRatingClass = (rating) => {
            const r = (rating || '').toLowerCase();
            if (r === 'good') return 'good';
            if (r === 'average') return 'average';
            if (r === 'poor') return 'poor';
            return '';
        };

        const batter = rawAnalysisJSON.evaluation_and_feedback?.batter || {};
        const bowler = rawAnalysisJSON.evaluation_and_feedback?.bowler || {};

        document.getElementById('pdf-evals').innerHTML = `
            <div class="pdf-eval-card batter">
                <div class="pdf-eval-header">
                    <div class="pdf-eval-role">Batter Analysis</div>
                    <div class="pdf-badge ${getRatingClass(batter.quality_rating)}">${batter.quality_rating || '-'}</div>
                </div>
                <div class="pdf-eval-text">${batter.reasoning || '-'}</div>
                <div class="pdf-suggestion"><strong>Coach's Suggestion</strong>${batter.suggestion || '-'}</div>
            </div>
            <div class="pdf-eval-card bowler">
                <div class="pdf-eval-header">
                    <div class="pdf-eval-role">Bowler Analysis</div>
                    <div class="pdf-badge ${getRatingClass(bowler.quality_rating)}">${bowler.quality_rating || '-'}</div>
                </div>
                <div class="pdf-eval-text">${bowler.reasoning || '-'}</div>
                <div class="pdf-suggestion"><strong>Strategic Adjustment</strong>${bowler.suggestion || '-'}</div>
            </div>
        `;

        // 3. Generate PDF
        const template = document.getElementById('pdf-template');
        template.parentElement.style.display = 'block'; // Make visible temporarily for html2pdf
        
        const opt = {
            margin:       0,
            filename:     `ShotIQ-Report-${Date.now()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'px', format: [800, template.scrollHeight + 100], orientation: 'portrait' } // Auto-height
        };

        await html2pdf().set(opt).from(template).save();
        
        template.parentElement.style.display = 'none'; // Hide again
        showToast('Report Downloaded Successfully!', 'success');

    } catch (err) {
        console.error("PDF Generation Error:", err);
        showToast('Failed to generate PDF.', 'error');
        document.getElementById('pdf-template').parentElement.style.display = 'none';
    }
}
