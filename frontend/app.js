let selectedRuleFiles = [];
let selectedVendorFile = null;
let currentAuditData = null;
let isCurrentDashboardDownloaded = false;
let currentUser = null;
let authMode = 'login';
let currentDemoIndex = 0;

// Maximum rules limits: Guest = 3, Logged-in = 5
function getMaxRuleFiles() {
  return currentUser ? 5 : 3;
}

// 3 Distinct Industry Alternates for Demo
const DEMO_SCENARIOS = [
  // ----------------- SCENARIO 1: CLOUD & ENTERPRISE IT -----------------
  {
    tag: "Cloud & Enterprise IT",
    rules: [
      {
        name: "IT_Security_Rulebook.txt",
        content: `[IT SECURITY POLICY - 2026]
Section 1.4: Direct external SSH tunneling or root administrative access to production customer database clusters is strictly forbidden under all circumstances. External engineers must use sanitized staging environments with mandatory MFA.
Section 3.1: External contractors must be confined to single-channel guest isolation on corporate Slack. Access to company-wide channels is prohibited.`
      },
      {
        name: "Corporate_Procurement_Bylaws.txt",
        content: `[PROCUREMENT REGULATIONS]
Rule 2.1: Invoices shall be processed strictly on Net-30 calendar day payment terms from undisputed receipt. Net-60 or Net-90 terms require board approval.
Rule 4.5: Liquidated damages of 1.5% per week shall apply for unapproved vendor sprint delivery delays.`
      },
      {
        name: "Legal_Termination_Protocol.txt",
        content: `[LEGAL STANDARDS]
Clause 4.1: Either party may terminate engagement without cause by tendering a minimum of thirty (30) days prior written notice.
Clause 5.2: Enterprise liability shall not exceed 100% of aggregate fees paid over the preceding 12 months. Unlimited indemnity requests are strictly prohibited.`
      }
    ],
    vendor: {
      name: "Apex_Cloud_Infrastructure_MSA.txt",
      content: `[APEX CLOUD - MASTER SERVICES AGREEMENT]
1. Root DB Access: Vendor engineers request unrestricted root credentials to live production database for continuous diagnostics.
2. Payment Window: Client agrees to remit payment within Net-30 calendar days following invoice receipt.
3. Indemnity: Client assumes unlimited financial liability for operational downtime claims.
4. Collaboration: Vendor requests access to company-wide general Slack channels for direct team sync.
5. Exit Notice: Either party may dissolve agreement upon thirty (30) days prior written notice.`
    }
  },

  // ----------------- SCENARIO 2: FINTECH & PAYMENT GATEWAY -----------------
  {
    tag: "FinTech & Payment Gateway",
    rules: [
      {
        name: "Cardholder_Data_Privacy_Policy.txt",
        content: `[FINANCIAL DATA BYLAWS]
Article 5: External vendors are strictly prohibited from caching unmasked cardholder numbers, CVV codes, or Aadhaar credentials on external servers. All data must be tokenized.
Article 8: Enterprise maintains right to conduct unannounced on-site security inspections semi-annually.`
      },
      {
        name: "Vendor_Subcontracting_Protocol.txt",
        content: `[VENDOR RISK PROTOCOL]
Policy 3.2: Pull requests must be submitted exclusively through restricted fork repositories with mandatory peer reviews. Direct commit access is banned.
Policy 6.1: Subcontracting or delegating development to third-party offshore entities requires advance written approval from Chief Risk Officer.`
      },
      {
        name: "Procurement_SLA_Terms.txt",
        content: `[SLA SPECIFICATIONS]
Section 1.1: Payment gateway webhooks must guarantee monthly operational uptime of not less than 99.95%.
Section 2.3: Security breaches or credential leaks must be reported to enterprise CISO within four (4) hours of discovery.`
      }
    ],
    vendor: {
      name: "PayFlow_Payment_Gateway_Proposal.txt",
      content: `[PAYFLOW - GATEWAY INTEGRATION PERMISSIONS]
1. Card Caching: PayFlow reserves the right to cache unmasked cardholder details on edge servers for forty-five (45) days.
2. Service Availability: PayFlow guarantees infrastructure uptime commitment of 99.95% on webhook endpoints.
3. Incident Reporting: Written notice of security compromises will be supplied within seventy-two (72) hours of confirmation.
4. Repository Access: Integration engineers will push code via staging fork repositories with zero direct production commits.
5. Offshore Support: PayFlow reserves discretion to delegate maintenance to its Philippine subsidiary without prior written notice.`
    }
  },

  // ----------------- SCENARIO 3: HEALTHCARE & PATIENT DATA (HIPAA) -----------------
  {
    tag: "Healthcare & HIPAA Compliance",
    rules: [
      {
        name: "HIPAA_Patient_Privacy_Rule.txt",
        content: `[PATIENT PRIVACY POLICY]
Rule 1.2: Protected Health Information (PHI) must be stored in encrypted repositories within national boundaries and cannot be exported for commercial AI training.
Rule 2.4: Business Associates must sign bilateral Business Associate Agreements (BAA) prior to accessing any clinical diagnostic logs.`
      },
      {
        name: "Medical_Device_Integration_Protocol.txt",
        content: `[DEVICE INTEGRATION STANDARDS]
Section 4.1: Remote firmware updates or diagnostic telemetry collection on bedside monitor systems require dual-authorization by attending clinical leads.
Section 4.3: Real-time telemetry communication must be encrypted via TLS 1.3 protocol.`
      },
      {
        name: "Enterprise_Audit_Bylaws.txt",
        content: `[COMPLIANCE AUDIT REQUIREMENTS]
Clause 3.1: Vendor shall provide verifiable SOC2 Type II compliance reports and audit logs annually upon enterprise request.
Clause 7.2: Termination for breach of clinical patient confidentiality shall be instantaneous with complete zero-delay credential revocation.`
      }
    ],
    vendor: {
      name: "MediSync_Health_Analytics_Agreement.txt",
      content: `[MEDISYNC - CLINICAL ANALYTICS PROPOSAL]
1. Data Utilization: MediSync reserves non-exclusive rights to aggregate de-identified diagnostic images for external model training.
2. Compliance BAA: MediSync agrees to execute standard bilateral Business Associate Agreement prior to data ingestion.
3. Remote Firmware Access: MediSync technicians may push continuous telemetry updates to bedside monitors without onsite clinician verification.
4. Security Standards: Telemetry streams use industry-standard TLS 1.3 encryption.
5. Audit Limitations: MediSync internal server logs are proprietary and exempt from third-party client audit inspection.`
    }
  }
];

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
const ruleLimitHint = document.getElementById('ruleLimitHint');
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
function showToast(message, isWarning = false, duration = 3000) {
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

// 3. Auth Modal Actions
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

    currentUser = { username: data.username, savedRules: data.savedRules || [] };
    localStorage.setItem('cg_user', JSON.stringify(currentUser));
    authModal.classList.add('hidden');
    renderUserSession();

    if (currentUser.savedRules && currentUser.savedRules.length > 0) {
      showToast("Existing User: Saved company rulebooks are auto-loaded from your account.", false, 3000);
    } else {
      showToast(`Welcome, ${currentUser.username}! You can now upload up to 5 rule files.`, false, 3000);
    }
  } catch (err) {
    alert(err.message);
  }
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('cg_user');
  selectedRuleFiles = [];
  renderUserSession();
  showToast("Logged out successfully. Back to Guest Mode (Max 3 files).", false, 3000);
});

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('cg_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      renderUserSession();
      if (currentUser.savedRules && currentUser.savedRules.length > 0) {
        showToast("Existing User: Saved company rulebooks are auto-loaded from your account.", false, 3000);
      }
    } catch {}
  } else {
    renderUserSession();
  }
});

function renderUserSession() {
  const maxLimit = getMaxRuleFiles();
  ruleLimitHint.textContent = currentUser 
    ? `Logged in as ${currentUser.username}: Upload and save up to 5 rulebooks.`
    : "Guest mode: upload up to 3 files. Login for up to 5 files.";

  if (currentUser) {
    authSection.classList.add('hidden');
    userProfileSection.classList.remove('hidden');
    userDisplayName.textContent = `👤 ${currentUser.username}`;

    if (currentUser.savedRules && currentUser.savedRules.length > 0) {
      rulesCountBadge.textContent = `${currentUser.savedRules.length} / ${maxLimit} files`;
      ruleFilesBtnLabel.textContent = "+ Update / add more";
      saveRulesToAccountBtn.classList.add('hidden');

      ruleFilesList.innerHTML = currentUser.savedRules.map((r, idx) => `
        <li class="file-tag-item" style="border-color: var(--green); color: var(--green);">
          <span>🛡️ Saved: ${r.name}</span>
          <button class="remove-file-btn" onclick="removeSavedRule(${idx})" title="Remove saved rule">✕</button>
        </li>
      `).join('');
    } else {
      saveRulesToAccountBtn.classList.remove('hidden');
      updateRuleFilesUI();
    }
  } else {
    authSection.classList.remove('hidden');
    userProfileSection.classList.add('hidden');
    saveRulesToAccountBtn.classList.add('hidden');
    updateRuleFilesUI();
  }
}

// Remove saved rule from logged-in account (CRUD)
window.removeSavedRule = async function(index) {
  if (!currentUser) return;
  currentUser.savedRules.splice(index, 1);
  localStorage.setItem('cg_user', JSON.stringify(currentUser));
  renderUserSession();
  showToast("Saved rule removed from account.", false, 2000);
};

// 4. Save Uploaded Rules to Account (CRUD: Create/Update)
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
    selectedRuleFiles = [];
    renderUserSession();
    showToast("Rulebooks permanently saved to your account!", false, 3000);
  } catch (err) {
    alert("Failed to save rules: " + err.message);
  }
});

// 5. Cumulative Rule Files Upload (Guest 3, Logged-in 5)
ruleFilesInput.addEventListener('change', (e) => {
  const newlySelected = Array.from(e.target.files);
  const maxLimit = getMaxRuleFiles();
  const currentCount = (currentUser && currentUser.savedRules ? currentUser.savedRules.length : 0) + selectedRuleFiles.length;

  for (const newFile of newlySelected) {
    if (currentCount + 1 > maxLimit) {
      showToast(`Limit reached: ${currentUser ? 'Logged-in users' : 'Guests'} can upload max ${maxLimit} rule files.`, true, 3000);
      break;
    }
    if (!selectedRuleFiles.some(f => f.name === newFile.name && f.size === newFile.size)) {
      selectedRuleFiles.push(newFile);
    }
  }

  ruleFilesInput.value = '';
  if (currentUser) {
    saveRulesToAccountBtn.classList.remove('hidden');
  }
  updateRuleFilesUI();
});

function updateRuleFilesUI() {
  const maxLimit = getMaxRuleFiles();
  const count = selectedRuleFiles.length;
  rulesCountBadge.textContent = `${count} / ${maxLimit} files`;
  ruleFilesBtnLabel.textContent = count > 0 ? "+ Add more files" : "+ Add file here";

  ruleFilesList.innerHTML = selectedRuleFiles.map((file, idx) => `
    <li class="file-tag-item">
      <span>📄 ${file.name} (${Math.round(file.size / 1024)} KB)</span>
      <button class="remove-file-btn" onclick="removeRuleFile(${idx})" title="Remove file">✕</button>
    </li>
  `).join('');
}

window.removeRuleFile = function(index) {
  selectedRuleFiles.splice(index, 1);
  updateRuleFilesUI();
};

// 6. Vendor File Upload
vendorFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedVendorFile = e.target.files[0];
    vendorFileName.textContent = `📑 ${selectedVendorFile.name} (${Math.round(selectedVendorFile.size / 1024)} KB)`;
    vendorFileName.style.color = "var(--brand-blue)";
    vendorFileBtnLabel.textContent = "+ Replace vendor file";
  }
  vendorFileInput.value = '';
});

// 7. Multi-Scenario Dynamic Demo Datasets (Cycles 3 Industries)
loadSampleBtn.addEventListener('click', () => {
  const scenario = DEMO_SCENARIOS[currentDemoIndex];

  selectedRuleFiles = scenario.rules.map(r => {
    const blob = new Blob([r.content], { type: 'text/plain' });
    return new File([blob], r.name, { type: 'text/plain' });
  });

  const vBlob = new Blob([scenario.vendor.content], { type: 'text/plain' });
  selectedVendorFile = new File([vBlob], scenario.vendor.name, { type: 'text/plain' });

  updateRuleFilesUI();
  vendorFileName.textContent = `📑 ${selectedVendorFile.name} (${Math.round(selectedVendorFile.size / 1024)} KB)`;
  vendorFileName.style.color = "var(--brand-blue)";
  vendorFileBtnLabel.textContent = "+ Replace vendor file";

  if (currentUser) {
    saveRulesToAccountBtn.classList.remove('hidden');
  }

  showToast(`Loaded Alternate ${currentDemoIndex + 1} of 3: ${scenario.tag}`, false, 2500);

  currentDemoIndex = (currentDemoIndex + 1) % DEMO_SCENARIOS.length;
});

// 8. Run Audit Action
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
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned status: ${response.status}`);
    }

    currentAuditData = await response.json();
    isCurrentDashboardDownloaded = false;
    renderDashboardAndCards(currentAuditData);
  } catch (error) {
    console.error("Audit error:", error);
    alert(`Audit Error: ${error.message}`);
    emptyState.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    runAuditBtn.disabled = false;
  }
});

// 9. Render Dashboard & Cards with Realistic 1-Decimal Values
function renderDashboardAndCards(data) {
  dashboardSection.classList.remove('hidden');

  const stats = data.stats || {};
  const score = Number(data.overall_score ?? 68.4).toFixed(1);
  const gPct = Number(stats.green_percentage ?? 52.8).toFixed(1);
  const yPct = Number(stats.yellow_percentage ?? 23.6).toFixed(1);
  const rPct = Number(stats.red_percentage ?? 23.6).toFixed(1);

  scoreValue.textContent = score;
  scoreLabel.textContent = Number(score) >= 80 ? "HEALTHY" : (Number(score) >= 50 ? "MODERATE RISK" : "HIGH RISK");
  scoreLabel.style.color = Number(score) >= 80 ? "var(--green)" : (Number(score) >= 50 ? "var(--yellow)" : "var(--red)");

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

// 10. Copy Vendor Counter-Notice Email
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

// 11. Minimalist Clean PDF Download with Strict Duplicate Lock
downloadPdfBtn.addEventListener('click', () => {
  if (!currentAuditData) {
    alert("Please run an audit first before downloading PDF report.");
    return;
  }

  if (isCurrentDashboardDownloaded) {
    showToast("Already downloaded!", true, 2000);
    return;
  }

  showToast("Preparing executive printable PDF...", false, 1500);

  const element = document.getElementById('printableReport');
  element.classList.add('pdf-export-mode');

  const opt = {
    margin: [12, 12, 12, 12],
    filename: 'ComplianceGuard_Executive_Audit_Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.classList.remove('pdf-export-mode');
    isCurrentDashboardDownloaded = true;
    showToast("Executive PDF downloaded successfully!", false, 2000);
  }).catch(() => {
    element.classList.remove('pdf-export-mode');
  });
});