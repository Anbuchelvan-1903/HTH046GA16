let selectedRuleFiles = [];
let selectedVendorFile = null;

// Demo Datasets (Very easy to read)
const DEMO_RULES = `[RULEBOOK 1: FINANCE RULES]
Rule 1.1: All external vendor payment terms must strictly not exceed Net-30 days from invoice date. Net-60 or Net-90 terms are strictly forbidden.

[RULEBOOK 2: IT DATA SECURITY POLICY]
Rule 4.2: Direct vendor access to live production databases is strictly forbidden. Vendors can only test against anonymized test/staging environments with 2FA.

[RULEBOOK 3: CONTRACT TERMINATION]
Rule 5.1: Standard termination notice periods shall require a minimum of thirty (30) calendar days notification.`;

const DEMO_VENDOR = `1. PAYMENT WINDOW: The Client agrees to remit payment within Net-30 calendar days following invoice receipt.
2. DATABASE ACCESS: Vendor requests full administrative root access to Production customer database for live debugging.
3. CHAT APP COLLABORATION: Vendor requests single-channel guest membership in company Slack for asynchronous team communication.
4. CONTRACT TERMINATION: Either party may terminate this agreement at any time with thirty (30) days prior written notice.`;

// DOM Selectors
const ruleFilesInput = document.getElementById('ruleFilesInput');
const vendorFileInput = document.getElementById('vendorFileInput');
const ruleFilesList = document.getElementById('ruleFilesList');
const vendorFileName = document.getElementById('vendorFileName');
const rulesCountBadge = document.getElementById('rulesCountBadge');
const vendorCountBadge = document.getElementById('vendorCountBadge');
const runAuditBtn = document.getElementById('runAuditBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');

const loader = document.getElementById('loader');
const emptyState = document.getElementById('emptyState');
const dashboardSection = document.getElementById('dashboardSection');
const resultsContainer = document.getElementById('resultsContainer');

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
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// 1. Theme Switcher (Dark / Light)
themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', targetTheme);

  if (targetTheme === 'light') {
    themeIcon.textContent = '🌙';
    themeLabel.textContent = 'Dark Mode';
  } else {
    themeIcon.textContent = '☀️';
    themeLabel.textContent = 'Light Mode';
  }
});

// 2. Handle Multiple Rule Files Selection
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

// 3. Handle Vendor Permission File Selection
vendorFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedVendorFile = e.target.files[0];
    vendorCountBadge.textContent = "1 file";
    vendorFileName.textContent = `📑 ${selectedVendorFile.name} (${Math.round(selectedVendorFile.size / 1024)} KB)`;
    vendorFileName.style.color = "var(--brand-blue)";
  }
});

// 4. Load Demo Datasets (Instant 1-Click setup)
loadSampleBtn.addEventListener('click', () => {
  const ruleBlob = new Blob([DEMO_RULES], { type: 'text/plain' });
  const vendorBlob = new Blob([DEMO_VENDOR], { type: 'text/plain' });

  selectedRuleFiles = [
    new File([ruleBlob], "HR_&_Corporate_Rules.txt", { type: 'text/plain' }),
    new File([ruleBlob], "IT_Security_Rulebook.txt", { type: 'text/plain' }),
    new File([ruleBlob], "Finance_Standard_Policy.txt", { type: 'text/plain' })
  ];
  selectedVendorFile = new File([vendorBlob], "Vendor_Permission_Requests.txt", { type: 'text/plain' });

  renderRuleFilesList();
  vendorCountBadge.textContent = "1 file";
  vendorFileName.textContent = `📑 ${selectedVendorFile.name}`;
  vendorFileName.style.color = "var(--brand-blue)";
});

// 5. Run Compliance Audit
runAuditBtn.addEventListener('click', async () => {
  if (selectedRuleFiles.length === 0 || !selectedVendorFile) {
    alert("Please select your Rule Files and 1 Vendor Permission File, or click '⚡ Load Demo Datasets'!");
    return;
  }

  // Clear previous and show loader
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
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    renderDashboardAndCards(data);
    downloadPdfBtn.classList.remove('hidden');
  } catch (error) {
    console.error("Audit error:", error);
    alert("Connection Error: Backend server is not responding at http://localhost:8000. Run 'node server.js' first.");
    emptyState.classList.remove('hidden');
  } finally {
    // Loader disappears completely
    loader.classList.add('hidden');
    runAuditBtn.disabled = false;
  }
});

// 6. Render Super-Clear Findings Cards & Metric Dashboard
function renderDashboardAndCards(data) {
  dashboardSection.classList.remove('hidden');

  const stats = data.stats || {};
  const score = data.overall_score ?? 65;
  const gPct = Math.round(stats.green_percentage ?? 50);
  const yPct = Math.round(stats.yellow_percentage ?? 25);
  const rPct = Math.round(stats.red_percentage ?? 25);

  scoreValue.textContent = score;
  scoreLabel.textContent = score >= 80 ? "HEALTHY" : (score >= 50 ? "MODERATE RISK" : "HIGH RISK");
  scoreLabel.style.color = score >= 80 ? "var(--green)" : (score >= 50 ? "var(--yellow)" : "var(--red)");

  greenPct.textContent = `${gPct}%`;
  yellowPct.textContent = `${yPct}%`;
  redPct.textContent = `${rPct}%`;

  greenCount.textContent = `${stats.green_count ?? 0} permissions`;
  yellowCount.textContent = `${stats.yellow_count ?? 0} unlisted`;
  redCount.textContent = `${stats.red_count ?? 0} violations`;

  // Animate progress bar widths
  barGreen.style.width = `${gPct}%`;
  barYellow.style.width = `${yPct}%`;
  barRed.style.width = `${rPct}%`;

  summaryText.textContent = data.summary || "Audit complete.";

  const findings = data.findings || [];
  resultsContainer.innerHTML = findings.map(item => {
    const signal = item.signal || 'YELLOW';
    const icon = signal === 'RED' ? '🔴' : (signal === 'YELLOW' ? '🟡' : '🟢');

    return `
      <div class="card ${signal}">
        <div class="card-header">
          <strong>${icon} ${item.title || item.id}</strong>
          <span class="badge ${signal}">${item.verdict || signal}</span>
        </div>

        <div class="field-block">
          <div class="field-label">What the Vendor Wants:</div>
          <div class="vendor-text">"${item.vendor_request}"</div>
        </div>

        ${item.rule_quote && item.rule_quote !== 'None' ? `
          <div class="field-block">
            <div class="field-label">What Your Rulebook Says (${item.rule_reference}):</div>
            <div class="quote-box">"${item.rule_quote}"</div>
          </div>
        ` : `
          <div class="field-block">
            <div class="field-label">Rulebook Status:</div>
            <div style="color: var(--yellow); font-size: 0.83rem;">⚠️ Not mentioned in any of your uploaded rulebooks.</div>
          </div>
        `}

        <div class="field-block">
          <div class="field-label">Why This Matters (Plain English):</div>
          <div style="color: var(--text-sub);">${item.simple_why}</div>
        </div>

        <div class="decision-banner">
          <strong>Recommended Decision:</strong> ${item.decision_advice}
        </div>

        ${item.replacement_clause ? `
          <div class="redline-box">
            <div>
              <span style="font-size: 0.72rem; font-weight:700; color: var(--text-muted); text-transform:uppercase; display:block;">Suggested Safe Replacement Clause:</span>
              <span class="clause-copy-text">"${item.replacement_clause}"</span>
            </div>
            <button class="copy-btn" onclick="copyClause('${encodeURIComponent(item.replacement_clause)}')">📋 Copy Clause</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// 7. Clipboard Copy with Toast Alert
window.copyClause = function(encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    toastMsg.textContent = "Safe replacement clause copied to clipboard!";
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  });
};

// 8. 1-Click Executive PDF Export (Uses clean browser print sheet)
downloadPdfBtn.addEventListener('click', () => {
  window.print();
});