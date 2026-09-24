// State variables for selected files
let selectedRuleFiles = [];
let selectedVendorFile = null;

// Built-in Demo Data to allow instant 1-Click test without choosing files manually
const DEMO_RULES = `[RULEBOOK 1: FINANCE & PAYMENT]
Section 1.1: All external vendor payment terms must strictly not exceed Net-30 days from invoice date. Net-60 or Net-90 terms are strictly prohibited without written CFO approval.

[RULEBOOK 2: IT DATA SECURITY & ACCESS]
Section 4.2: Direct vendor access to production databases is strictly prohibited under all circumstances. Only anonymized staging DB access allowed with 2FA.

[RULEBOOK 3: TERMINATION PROTOCOL]
Section 5.1: Standard termination notice periods shall require a minimum of thirty (30) calendar days notification.`;

const DEMO_VENDOR = `1. PAYMENT TERMS: The Client agrees to remit payment within Net-30 calendar days following invoice receipt.
2. DATABASE ACCESS: Vendor requests full administrative root access to Production customer database for live debugging.
3. CHAT COLLABORATION: Vendor requests single-channel guest membership in company Slack for asynchronous team communication.
4. TERMINATION NOTICE: Either party may terminate this agreement at any time with thirty (30) days prior written notice.`;

// DOM Elements
const ruleFilesInput = document.getElementById('ruleFilesInput');
const vendorFileInput = document.getElementById('vendorFileInput');
const ruleFilesList = document.getElementById('ruleFilesList');
const vendorFileName = document.getElementById('vendorFileName');
const rulesCountBadge = document.getElementById('rulesCountBadge');
const vendorCountBadge = document.getElementById('vendorCountBadge');
const runAuditBtn = document.getElementById('runAuditBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');

const loader = document.getElementById('loader');
const emptyState = document.getElementById('emptyState');
const dashboardSection = document.getElementById('dashboardSection');
const resultsContainer = document.getElementById('resultsContainer');

// Dashboard Elements
const scoreValue = document.getElementById('scoreValue');
const scoreLabel = document.getElementById('scoreLabel');
const greenPct = document.getElementById('greenPct');
const yellowPct = document.getElementById('yellowPct');
const redPct = document.getElementById('redPct');
const greenCount = document.getElementById('greenCount');
const yellowCount = document.getElementById('yellowCount');
const redCount = document.getElementById('redCount');
const barGreen = document.getElementById('barGreen');
const barYellow = document.getElementById('barYellow');
const barRed = document.getElementById('barRed');
const summaryText = document.getElementById('summaryText');

// 1. Handle Multiple Rule Files Selection
ruleFilesInput.addEventListener('change', (e) => {
  selectedRuleFiles = Array.from(e.target.files);
  renderRuleFilesList();
});

function renderRuleFilesList() {
  rulesCountBadge.textContent = `${selectedRuleFiles.length} files`;
  ruleFilesList.innerHTML = selectedRuleFiles.map((file, idx) => `
    <li class="file-tag-item">📄 Rule ${idx + 1}: ${file.name} (${Math.round(file.size / 1024)} KB)</li>
  `).join('');
}

// 2. Handle Single Vendor Permission File Selection
vendorFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedVendorFile = e.target.files[0];
    vendorCountBadge.textContent = "1 file";
    vendorFileName.textContent = `📑 ${selectedVendorFile.name} (${Math.round(selectedVendorFile.size / 1024)} KB)`;
    vendorFileName.style.color = "#38bdf8";
  }
});

// 3. 1-Click Demo Setup
loadSampleBtn.addEventListener('click', () => {
  const ruleBlob1 = new Blob([DEMO_RULES], { type: 'text/plain' });
  const vendorBlob = new Blob([DEMO_VENDOR], { type: 'text/plain' });

  selectedRuleFiles = [
    new File([ruleBlob1], "Corporate_Rules_Consolidated.txt", { type: 'text/plain' }),
    new File([ruleBlob1], "IT_Security_Policy_v3.txt", { type: 'text/plain' }),
    new File([ruleBlob1], "Finance_Governance_Rulebook.txt", { type: 'text/plain' })
  ];
  selectedVendorFile = new File([vendorBlob], "Vendor_Access_Permissions_Req.txt", { type: 'text/plain' });

  renderRuleFilesList();
  vendorCountBadge.textContent = "1 file";
  vendorFileName.textContent = `📑 ${selectedVendorFile.name}`;
  vendorFileName.style.color = "#38bdf8";
});

// 4. Run Audit Button Action
runAuditBtn.addEventListener('click', async () => {
  if (selectedRuleFiles.length === 0 || !selectedVendorFile) {
    alert("Please choose at least 1 Rule File (or 3+ files) and 1 Vendor Permission File, or click '⚡ Load Demo Datasets'!");
    return;
  }

  emptyState.classList.add('hidden');
  dashboardSection.classList.add('hidden');
  resultsContainer.innerHTML = '';
  loader.classList.remove('hidden');
  runAuditBtn.disabled = true;

  const formData = new FormData();
  selectedRuleFiles.forEach(file => {
    formData.append('ruleFiles', file);
  });
  formData.append('vendorFile', selectedVendorFile);

  try {
    const response = await fetch('http://localhost:8000/api/audit-multi', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server returned status code: ${response.status}`);
    }

    const data = await response.json();
    renderDashboardAndCards(data);
  } catch (error) {
    console.error("Audit error:", error);
    alert("Connection Error: Backend server is not responding at http://localhost:8000. Run 'node server.js' first.");
    emptyState.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    runAuditBtn.disabled = false;
  }
});

// 5. Render Visual Dashboard & Traffic Light Cards
function renderDashboardAndCards(data) {
  dashboardSection.classList.remove('hidden');

  const stats = data.stats || {};
  const score = data.overall_score ?? 65;
  const gPct = Math.round(stats.green_percentage ?? 50);
  const yPct = Math.round(stats.yellow_percentage ?? 25);
  const rPct = Math.round(stats.red_percentage ?? 25);

  scoreValue.textContent = score;
  scoreLabel.textContent = score >= 80 ? "HEALTHY" : (score >= 50 ? "MODERATE RISK" : "CRITICAL RISK");
  scoreLabel.style.color = score >= 80 ? "#4ade80" : (score >= 50 ? "#facc15" : "#f87171");

  greenPct.textContent = `${gPct}%`;
  yellowPct.textContent = `${yPct}%`;
  redPct.textContent = `${rPct}%`;

  greenCount.textContent = `${stats.green_count ?? 0} compliant`;
  yellowCount.textContent = `${stats.yellow_count ?? 0} tolerable`;
  redCount.textContent = `${stats.red_count ?? 0} violations`;

  // Animate progress segments
  barGreen.style.width = `${gPct}%`;
  barYellow.style.width = `${yPct}%`;
  barRed.style.width = `${rPct}%`;

  summaryText.textContent = data.summary || "Audit complete.";

  const findings = data.findings || [];
  resultsContainer.innerHTML = findings.map(item => {
    const signalClass = item.signal || 'YELLOW';
    const icon = signalClass === 'RED' ? '🔴' : (signalClass === 'YELLOW' ? '🟡' : '🟢');

    return `
      <div class="card ${signalClass}">
        <div class="card-header">
          <strong>${icon} ${item.title || item.id}</strong>
          <span class="badge ${signalClass}">${item.verdict || signalClass}</span>
        </div>

        <div class="field-block">
          <span class="field-label">VENDOR PERMISSION REQUEST:</span>
          <div>"${item.vendor_request}"</div>
        </div>

        ${item.rule_quote && item.rule_quote !== 'None' ? `
          <div class="field-block">
            <span class="field-label">MATCHED POLICY (${item.rule_reference}):</span>
            <div class="quote-box">"${item.rule_quote}"</div>
          </div>
        ` : `
          <div class="field-block">
            <span class="field-label">POLICY STATUS:</span>
            <div style="color: #facc15; font-size: 0.8rem;">⚠️ Not defined in any of your uploaded rulebooks.</div>
          </div>
        `}

        <div class="field-block">
          <span class="field-label">WHY / COMPLIANCE ANALYSIS:</span>
          <div style="color: #cbd5e1;">${item.why_analysis}</div>
        </div>

        <div class="suggestion-box">
          <strong>Actionable Suggestion:</strong><br/>
          ${item.suggestion}
        </div>
      </div>
    `;
  }).join('');
}