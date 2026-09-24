// Cumulative state lists for files
let selectedRuleFiles = [];
let selectedVendorFile = null;
let currentAuditData = null;
let isCurrentDashboardDownloaded = false; // Tracks if current dashboard was already downloaded

// Demo Datasets (Simple Plain English)
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
const ruleFilesBtnLabel = document.getElementById('ruleFilesBtnLabel');
const vendorFileBtnLabel = document.getElementById('vendorFileBtnLabel');
const ruleFilesList = document.getElementById('ruleFilesList');
const vendorFileName = document.getElementById('vendorFileName');
const rulesCountBadge = document.getElementById('rulesCountBadge');
const vendorCountBadge = document.getElementById('vendorCountBadge');

const runAuditBtn = document.getElementById('runAuditBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');

const loader = document.getElementById('loader');
const emptyState = document.getElementById('emptyState');
const dashboardSection = document.getElementById('dashboardSection');
const resultsContainer = document.getElementById('resultsContainer');
const printableReport = document.getElementById('printableReport');

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

const countAll = document.getElementById('countAll');
const countRed = document.getElementById('countRed');
const countYellow = document.getElementById('countYellow');
const countGreen = document.getElementById('countGreen');
const filterTabs = document.querySelectorAll('.filter-tab');

const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// 1. Toast Notification Helper (with duration & icon)
function showToast(message, isWarning = false, duration = 2000) {
  toastMsg.textContent = message;
  toastIcon.textContent = isWarning ? "⚠️" : "✓";
  if (isWarning) {
    toast.classList.add('warning');
  } else {
    toast.classList.remove('warning');
  }
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// 2. Theme Toggle (Dark / Light)
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

// 3. Cumulative Rule Files Upload Handling
ruleFilesInput.addEventListener('change', (e) => {
  const newlySelected = Array.from(e.target.files);
  newlySelected.forEach(newFile => {
    // Avoid exact duplicate filenames
    if (!selectedRuleFiles.some(f => f.name === newFile.name && f.size === newFile.size)) {
      selectedRuleFiles.push(newFile);
    }
  });

  // Reset input value so re-selecting same file triggers change event
  ruleFilesInput.value = '';
  updateRuleFilesUI();
});

function updateRuleFilesUI() {
  const count = selectedRuleFiles.length;
  rulesCountBadge.textContent = `${count} files`;

  // Dynamic button label: "+ Add file here" vs "+ Add more files"
  if (count > 0) {
    ruleFilesBtnLabel.textContent = "+ Add more files";
  } else {
    ruleFilesBtnLabel.textContent = "+ Add file here";
  }

  // Render list with individual remove button
  ruleFilesList.innerHTML = selectedRuleFiles.map((file, idx) => `
    <li class="file-tag-item">
      <span>📄 Rule ${idx + 1}: ${file.name} (${Math.round(file.size / 1024)} KB)</span>
      <button class="remove-file-btn" onclick="removeRuleFile(${idx})" title="Remove file">✕</button>
    </li>
  `).join('');
}

window.removeRuleFile = function(index) {
  selectedRuleFiles.splice(index, 1);
  updateRuleFilesUI();
};

// 4. Vendor Permission File Upload Handling
vendorFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedVendorFile = e.target.files[0];
    vendorCountBadge.textContent = "1 file";
    vendorFileName.textContent = `📑 ${selectedVendorFile.name} (${Math.round(selectedVendorFile.size / 1024)} KB)`;
    vendorFileName.style.color = "var(--brand-blue)";
    vendorFileBtnLabel.textContent = "+ Replace vendor file";
  }
  vendorFileInput.value = '';
});

// 5. 1-Click Demo Datasets
loadSampleBtn.addEventListener('click', () => {
  const ruleBlob = new Blob([DEMO_RULES], { type: 'text/plain' });
  const vendorBlob = new Blob([DEMO_VENDOR], { type: 'text/plain' });

  selectedRuleFiles = [
    new File([ruleBlob], "HR_&_Corporate_Rules.txt", { type: 'text/plain' }),
    new File([ruleBlob], "IT_Security_Rulebook.txt", { type: 'text/plain' }),
    new File([ruleBlob], "Finance_Standard_Policy.txt", { type: 'text/plain' })
  ];
  selectedVendorFile = new File([vendorBlob], "Vendor_Permission_Requests.txt", { type: 'text/plain' });

  updateRuleFilesUI();
  vendorCountBadge.textContent = "1 file";
  vendorFileName.textContent = `📑 ${selectedVendorFile.name}`;
  vendorFileName.style.color = "var(--brand-blue)";
  vendorFileBtnLabel.textContent = "+ Replace vendor file";
});

// 6. Run Compliance Audit
runAuditBtn.addEventListener('click', async () => {
  if (selectedRuleFiles.length === 0 || !selectedVendorFile) {
    alert("Please upload at least 1 Rule File and 1 Vendor Permission File, or click '⚡ Load Demo Datasets'!");
    return;
  }

  // Clear previous & show loading screen
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

    currentAuditData = await response.json();
    isCurrentDashboardDownloaded = false; // Reset download flag for this new audit
    renderDashboardAndCards(currentAuditData);

    // Reveal Action Buttons
    downloadPdfBtn.classList.remove('hidden');
    copyEmailBtn.classList.remove('hidden');
  } catch (error) {
    console.error("Audit error:", error);
    alert("Connection Error: Backend server is not responding at http://localhost:8000. Run 'node server.js' first.");
    emptyState.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    runAuditBtn.disabled = false;
  }
});

// 7. Render Dashboard & Traffic Light Cards
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
  countAll.textContent = findings.length;
  countRed.textContent = findings.filter(f => f.signal === 'RED').length;
  countYellow.textContent = findings.filter(f => f.signal === 'YELLOW').length;
  countGreen.textContent = findings.filter(f => f.signal === 'GREEN').length;

  renderFilteredCards('ALL');
}

// 8. Filter Cards by Signal (All / Red / Yellow / Green)
function renderFilteredCards(filter) {
  if (!currentAuditData) return;
  const findings = currentAuditData.findings || [];
  const filtered = filter === 'ALL' ? findings : findings.filter(f => f.signal === filter);

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No items found in this filter category.</div>`;
    return;
  }

  resultsContainer.innerHTML = filtered.map(item => {
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

// Filter Tab Click Handlers
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderFilteredCards(tab.getAttribute('data-filter'));
  });
});

// 9. 1-Click Clipboard Copy for Clauses
window.copyClause = function(encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    showToast("Safe replacement clause copied to clipboard!", false, 2000);
  });
};

// 10. 1-Click Vendor Negotiation Email Generator
copyEmailBtn.addEventListener('click', () => {
  if (!currentAuditData) return;
  const findings = currentAuditData.findings || [];
  const redItems = findings.filter(f => f.signal === 'RED');
  const yellowItems = findings.filter(f => f.signal === 'YELLOW');

  let emailBody = `Subject: Automated Compliance Review & Amendment Feedback\n\n`;
  emailBody += `Dear Vendor Legal & Partnerships Team,\n\n`;
  emailBody += `We have completed our automated cross-document compliance review of your requested agreement permissions. Below is our formal compliance determination:\n\n`;

  if (redItems.length > 0) {
    emailBody += `--- 🔴 REQUIRED REDLINE AMENDMENTS ---\n`;
    redItems.forEach(item => {
      emailBody += `• Clause: ${item.title}\n`;
      emailBody += `  Finding: ${item.simple_why}\n`;
      emailBody += `  Required Redline: "${item.replacement_clause}"\n\n`;
    });
  }

  if (yellowItems.length > 0) {
    emailBody += `--- 🟡 CONDITIONAL APPROVAL ITEMS ---\n`;
    yellowItems.forEach(item => {
      emailBody += `• Request: ${item.title}\n`;
      emailBody += `  Condition: ${item.decision_advice}\n\n`;
    });
  }

  emailBody += `Please review and confirm these amendments so we can proceed with execution.\n\nBest regards,\nCorporate Risk & Compliance Team`;

  navigator.clipboard.writeText(emailBody).then(() => {
    showToast("Vendor negotiation email copied to clipboard!", false, 2500);
  });
});

// 11. Direct PDF Download with Duplicate Check Pop-Up
downloadPdfBtn.addEventListener('click', () => {
  // If already downloaded for this current audit, show 2-second pop-up warning
  if (isCurrentDashboardDownloaded) {
    showToast("Already downloaded!", true, 2000);
    return;
  }

  showToast("Generating direct PDF download...", false, 1500);

  const element = document.getElementById('printableReport');
  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'ComplianceGuard_Executive_Audit_Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    isCurrentDashboardDownloaded = true; // Mark as downloaded
  });
});