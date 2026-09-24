let selectedRuleFiles = [];
let selectedVendorFile = null;
let currentAuditData = null;
let isCurrentDashboardDownloaded = false;
let currentUser = null; // Stored user state: { username, savedRules }
let authMode = 'login'; // 'login' or 'signup'

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
const authSection = document.getElementById('authSection');
const userProfileSection = document.getElementById('userProfileSection');
const userDisplayName = document.getElementById('userDisplayName');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');

const authModal = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');
const modalTogglePrompt = document.getElementById('modalTogglePrompt');
const modalToggleLink = document.getElementById('modalToggleLink');

const ruleFilesInput = document.getElementById('ruleFilesInput');
const vendorFileInput = document.getElementById('vendorFileInput');
const ruleFilesBtnLabel = document.getElementById('ruleFilesBtnLabel');
const vendorFileBtnLabel = document.getElementById('vendorFileBtnLabel');
const ruleFilesList = document.getElementById('ruleFilesList');
const vendorFileName = document.getElementById('vendorFileName');
const rulesCountBadge = document.getElementById('rulesCountBadge');
const vendorCountBadge = document.getElementById('vendorCountBadge');
const persistentRulesBanner = document.getElementById('persistentRulesBanner');
const saveRulesToAccountBtn = document.getElementById('saveRulesToAccountBtn');

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

// 1. Toast Notification Helper
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

// 2. Theme Toggle
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

// 3. AUTH MODAL LOGIC
loginBtn.addEventListener('click', () => openAuthModal('login'));
signupBtn.addEventListener('click', () => openAuthModal('signup'));
closeModalBtn.addEventListener('click', () => authModal.classList.add('hidden'));

function openAuthModal(mode) {
  authMode = mode;
  authUsernameInput.value = '';
  authPasswordInput.value = '';

  if (mode === 'login') {
    modalTitle.textContent = "Login to ComplianceGuard";
    modalSubmitBtn.textContent = "Login";
    modalTogglePrompt.textContent = "Don't have an account?";
    modalToggleLink.textContent = "Sign Up";
  } else {
    modalTitle.textContent = "Create an Account";
    modalSubmitBtn.textContent = "Sign Up";
    modalTogglePrompt.textContent = "Already have an account?";
    modalToggleLink.textContent = "Login";
  }
  authModal.classList.remove('hidden');
}

modalToggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  openAuthModal(authMode === 'login' ? 'signup' : 'login');
});

modalSubmitBtn.addEventListener('click', async () => {
  const username = authUsernameInput.value.trim();
  const password = authPasswordInput.value.trim();

  if (!username || !password) {
    alert("Please enter username and password.");
    return;
  }

  const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';

  try {
    const res = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    // Set Logged In State
    currentUser = { username: data.username, savedRules: data.savedRules || [] };
    localStorage.setItem('cg_user', JSON.stringify(currentUser));
    authModal.classList.add('hidden');
    renderUserSession();
    showToast(`Welcome, ${currentUser.username}!`, false, 2000);

  } catch (err) {
    alert(err.message);
  }
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('cg_user');
  renderUserSession();
  showToast("Logged out successfully.", false, 2000);
});

// Restore session on page load
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('cg_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      renderUserSession();
    } catch {}
  }
});

function renderUserSession() {
  if (currentUser) {
    authSection.classList.add('hidden');
    userProfileSection.classList.remove('hidden');
    userDisplayName.textContent = `👤 ${currentUser.username}`;

    // If user has saved rules, auto-load them
    if (currentUser.savedRules && currentUser.savedRules.length > 0) {
      persistentRulesBanner.classList.remove('hidden');
      rulesCountBadge.textContent = `${currentUser.savedRules.length} saved files`;
      ruleFilesBtnLabel.textContent = "+ Update / add more";
      saveRulesToAccountBtn.classList.add('hidden');

      ruleFilesList.innerHTML = currentUser.savedRules.map((r, idx) => `
        <li class="file-tag-item" style="border-color: var(--green); color: var(--green);">
          <span>🛡️ Saved Rule ${idx + 1}: ${r.name} (Auto-Loaded)</span>
        </li>
      `).join('');
    } else {
      persistentRulesBanner.classList.add('hidden');
      saveRulesToAccountBtn.classList.remove('hidden');
      updateRuleFilesUI();
    }
  } else {
    authSection.classList.remove('hidden');
    userProfileSection.classList.add('hidden');
    persistentRulesBanner.classList.add('hidden');
    saveRulesToAccountBtn.classList.add('hidden');
    updateRuleFilesUI();
  }
}

// 4. Save Uploaded Rules to Account
saveRulesToAccountBtn.addEventListener('click', async () => {
  if (!currentUser) {
    alert("Please login first to save rules to your account!");
    return;
  }
  if (selectedRuleFiles.length === 0) {
    alert("Please upload at least 1 rule file first.");
    return;
  }

  const formData = new FormData();
  formData.append('username', currentUser.username);
  selectedRuleFiles.forEach(f => formData.append('ruleFiles', f));

  try {
    const res = await fetch('http://localhost:8000/api/user/save-rules', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    currentUser.savedRules = data.savedRules;
    localStorage.setItem('cg_user', JSON.stringify(currentUser));
    renderUserSession();
    showToast("Rules permanently saved to your account!", false, 2500);
  } catch (err) {
    alert("Failed to save rules: " + err.message);
  }
});

// 5. CUMULATIVE RULE FILES UPLOAD
ruleFilesInput.addEventListener('change', (e) => {
  const newlySelected = Array.from(e.target.files);
  newlySelected.forEach(newFile => {
    if (!selectedRuleFiles.some(f => f.name === newFile.name && f.size === newFile.size)) {
      selectedRuleFiles.push(newFile);
    }
  });

  ruleFilesInput.value = '';
  if (currentUser) {
    saveRulesToAccountBtn.classList.remove('hidden');
  }
  updateRuleFilesUI();
});

function updateRuleFilesUI() {
  const count = selectedRuleFiles.length;
  if (!currentUser || !currentUser.savedRules || currentUser.savedRules.length === 0) {
    rulesCountBadge.textContent = `${count} files`;
    ruleFilesBtnLabel.textContent = count > 0 ? "+ Add more files" : "+ Add file here";
    ruleFilesList.innerHTML = selectedRuleFiles.map((file, idx) => `
      <li class="file-tag-item">
        <span>📄 Rule ${idx + 1}: ${file.name} (${Math.round(file.size / 1024)} KB)</span>
        <button class="remove-file-btn" onclick="removeRuleFile(${idx})" title="Remove file">✕</button>
      </li>
    `).join('');
  }
}

window.removeRuleFile = function(index) {
  selectedRuleFiles.splice(index, 1);
  updateRuleFilesUI();
};

// 6. VENDOR FILE UPLOAD
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

// 7. DEMO DATASETS
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
  if (currentUser) {
    saveRulesToAccountBtn.classList.remove('hidden');
  }
});

// 8. RUN AUDIT ACTION
runAuditBtn.addEventListener('click', async () => {
  const hasSavedRules = currentUser && currentUser.savedRules && currentUser.savedRules.length > 0;
  if (!hasSavedRules && selectedRuleFiles.length === 0) {
    alert("Please upload at least 1 Rule File (or login with saved rules), and choose 1 Vendor Permission File!");
    return;
  }
  if (!selectedVendorFile) {
    alert("Please upload 1 Vendor Permission File to audit!");
    return;
  }

  emptyState.classList.add('hidden');
  dashboardSection.classList.add('hidden');
  resultsContainer.innerHTML = '';
  loader.classList.remove('hidden');
  runAuditBtn.disabled = true;

  const formData = new FormData();
  if (currentUser) {
    formData.append('username', currentUser.username);
  }
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
    isCurrentDashboardDownloaded = false;
    renderDashboardAndCards(currentAuditData);

  } catch (error) {
    console.error("Audit error:", error);
    alert("Connection Error: Backend server is not responding at http://localhost:8000. Run 'node server.js' first.");
    emptyState.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    runAuditBtn.disabled = false;
  }
});

// 9. RENDER DASHBOARD & CARDS
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

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderFilteredCards(tab.getAttribute('data-filter'));
  });
});

window.copyClause = function(encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    showToast("Safe replacement clause copied to clipboard!", false, 2000);
  });
};

// 10. COPY VENDOR EMAIL
copyEmailBtn.addEventListener('click', () => {
  if (!currentAuditData) {
    alert("Please run an audit first to generate vendor counter-notice email.");
    return;
  }
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

// 11. DIRECT PDF DOWNLOAD WITH DUPLICATE CHECK POP-UP
downloadPdfBtn.addEventListener('click', () => {
  if (!currentAuditData) {
    alert("Please run an audit first before downloading PDF report.");
    return;
  }

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
    isCurrentDashboardDownloaded = true;
  });
});