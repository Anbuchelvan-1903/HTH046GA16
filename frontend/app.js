// ==========================================
// 1. LIVE RENDER BACKEND CONFIGURATION
// ==========================================
const API_BASE_URL = 'https://hth046ga16.onrender.com';

// Application State
let currentUser = null;
let savedRules = [];
let currentAuditResult = null;
let activeRuleFiles = [];
let activeVendorFile = null;

// ==========================================
// 2. REAL-WORLD DEMO SCENARIO DATASETS
// ==========================================
const DEMO_SCENARIOS = [
  {
    name: "Enterprise Cloud & IT Infrastructure",
    rules: [
      {
        name: "Company_Finance_Procurement_Rules.txt",
        content: `CORPORATE PROCUREMENT BYLAWS - RULE 2.1:
All approved vendor invoices shall be processed strictly on Net-30 calendar day payment terms from undisputed receipt.

RULE 4.2:
Automatic invoice escalation or penalty surcharge clauses exceeding 1.5% per annum are void and unenforceable.`
      },
      {
        name: "Company_IT_Security_Policy.txt",
        content: `IT SECURITY DIRECTIVE - SECTION 1.4:
Direct external SSH tunneling or root administrative access to production customer database clusters is strictly forbidden under all circumstances. Sanitized staging environments must be utilized.

SECTION 3.1:
External contractors must be confined to single-channel guest isolation on corporate Slack. Workspace-wide directory browsing permissions are prohibited.`
      },
      {
        name: "Company_Legal_Termination_Protocol.txt",
        content: `LEGAL TERMINATION PROTOCOL - CLAUSE 4.1:
Either party may terminate engagement without cause by tendering a minimum of thirty (30) days prior written notice.

CLAUSE 5.2:
The total cumulative liability of our enterprise arising under or related to this agreement shall strictly not exceed 100% of aggregate fees paid over preceding 12 months.`
      }
    ],
    vendor: {
      name: "Target_Vendor_Cloud_Contract.txt",
      content: `VENDOR PERMISSION REQUEST & MASTER SERVICES AGREEMENT:
1. Vendor engineers request unrestricted root credentials to live production database cluster for diagnostics.
2. Client assumes unlimited financial liability and indemnifies vendor against all operational downtime claims.
3. Vendor requests access to company-wide general Slack channels for direct team sync.
4. Client agrees to remit payment within Net-30 calendar days following invoice receipt.
5. Either party may dissolve agreement upon thirty (30) days prior written notice.`
    }
  }
];

let demoScenarioIndex = 0;

// ==========================================
// 3. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initAuthSystem();
  initUploadHandlers();
  initDemoLoader();
  initAuditExecution();
  initFilterTabs();
  restoreSavedSession();
});

// ==========================================
// 4. THEME MANAGEMENT
// ==========================================
function initThemeToggle() {
  const themeBtn = document.getElementById('themeToggleBtn') || document.getElementById('themeToggle');
  if (!themeBtn) return;

  const currentTheme = localStorage.getItem('compliance_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeBtn.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

  themeBtn.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = active === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('compliance_theme', next);
    themeBtn.textContent = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  });
}

// ==========================================
// 5. USER AUTHENTICATION & SESSION PERSISTENCE
// ==========================================
function initAuthSystem() {
  const authToggleBtn = document.getElementById('authToggleBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal') || document.getElementById('closeAuthBtn');
  const authForm = document.getElementById('authForm');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authSwitchLink = document.getElementById('authSwitchLink');
  const authTitle = document.getElementById('authTitle');
  const authError = document.getElementById('authError');

  let isLogin = true;

  if (authToggleBtn) {
    authToggleBtn.addEventListener('click', () => {
      if (currentUser) {
        logoutOfficer();
      } else if (authModal) {
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex';
      }
    });
  }

  if (closeAuthModal && authModal) {
    closeAuthModal.addEventListener('click', () => {
      authModal.classList.add('hidden');
      authModal.style.display = 'none';
    });
  }

  if (authSwitchLink) {
    authSwitchLink.addEventListener('click', (e) => {
      e.preventDefault();
      isLogin = !isLogin;
      if (authTitle) authTitle.textContent = isLogin ? 'Officer Sign In' : 'Register New Officer';
      if (authSubmitBtn) authSubmitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
      authSwitchLink.textContent = isLogin ? "Need an account? Register" : "Already registered? Sign In";
      if (authError) authError.textContent = '';
    });
  }

  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault();

    const usernameInput = document.getElementById('authUsername');
    const passwordInput = document.getElementById('authPassword');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!username || !password) {
      if (authError) authError.textContent = 'Username and password required.';
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (authError) authError.textContent = data.error || 'Authentication failed.';
        return;
      }

      currentUser = data.username;
      savedRules = data.savedRules || [];
      localStorage.setItem('compliance_user', currentUser);

      if (authModal) {
        authModal.classList.add('hidden');
        authModal.style.display = 'none';
      }

      updateUserUI();
      renderSavedRulesList();
      alert(`Welcome, Officer ${currentUser}! Quota unlocked: Ingest up to 5 Rulebooks.`);
    } catch (err) {
      if (authError) authError.textContent = 'Server connection error. Please try again.';
    }
  };

  if (authSubmitBtn) authSubmitBtn.addEventListener('click', handleAuthSubmit);
  if (authForm) authForm.addEventListener('submit', handleAuthSubmit);
}

function updateUserUI() {
  const badge = document.getElementById('userQuotaBadge');
  const authToggleBtn = document.getElementById('authToggleBtn');
  const savedSection = document.getElementById('savedRulesSection');

  if (currentUser) {
    if (badge) badge.textContent = `Officer: ${currentUser} (Tier: 5 Rules)`;
    if (authToggleBtn) authToggleBtn.textContent = 'Logout';
    if (savedSection) savedSection.classList.remove('hidden');
  } else {
    if (badge) badge.textContent = 'Guest Tier (Max 3 Rules)';
    if (authToggleBtn) authToggleBtn.textContent = 'Officer Sign In';
    if (savedSection) savedSection.classList.add('hidden');
  }
}

function logoutOfficer() {
  currentUser = null;
  savedRules = [];
  localStorage.removeItem('compliance_user');
  updateUserUI();
  renderSavedRulesList();
  alert('Signed out successfully.');
}

async function restoreSavedSession() {
  const storedUser = localStorage.getItem('compliance_user');
  if (storedUser) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/rules?username=${encodeURIComponent(storedUser)}`);
      if (res.ok) {
        const data = await res.json();
        currentUser = storedUser;
        savedRules = data.rules || [];
        updateUserUI();
        renderSavedRulesList();
      }
    } catch {
      localStorage.removeItem('compliance_user');
    }
  }
}

// ==========================================
// 6. PERSISTENT RULEBOOKS CRUD
// ==========================================
function renderSavedRulesList() {
  const container = document.getElementById('savedRulesList');
  if (!container) return;

  container.innerHTML = '';

  if (savedRules.length === 0) {
    container.innerHTML = '<p class="text-muted">No persistent rulebooks saved yet.</p>';
    return;
  }

  savedRules.forEach((rule, idx) => {
    const badge = document.createElement('div');
    badge.className = 'saved-rule-badge';
    badge.innerHTML = `
      <span>📄 ${rule.name}</span>
      <button type="button" class="btn-delete-rule" onclick="deleteSavedRulebook(${idx})" title="Remove">✕</button>
    `;
    container.appendChild(badge);
  });
}

window.deleteSavedRulebook = async function(index) {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/rules/${index}?username=${encodeURIComponent(currentUser)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      savedRules = data.savedRules || [];
      renderSavedRulesList();
    }
  } catch (err) {
    console.error('Failed to delete rulebook:', err);
  }
};

// ==========================================
// 7. FILE UPLOADS & CUSTOM ADD-BUTTON HANDLERS
// ==========================================
function initUploadHandlers() {
  const ruleInput = document.getElementById('ruleFilesInput') || document.getElementById('ruleFiles');
  const vendorInput = document.getElementById('vendorFileInput') || document.getElementById('vendorFile');

  document.querySelectorAll('button').forEach(btn => {
    const txt = btn.textContent.toLowerCase();
    if (txt.includes('add file') || txt.includes('+ add') || txt.includes('replace vendor')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = btn.closest('.upload-zone') || btn.closest('.drop-box') || btn.parentElement;
        const targetInput = parent ? parent.querySelector('input[type="file"]') : null;
        if (targetInput) {
          targetInput.click();
        }
      });
    }
  });

  if (ruleInput) {
    ruleInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        activeRuleFiles = Array.from(e.target.files);
        updateUploadBadge(ruleInput, `✓ ${activeRuleFiles.length} Rulebook(s) Selected`);
      }
    });
  }

  if (vendorInput) {
    vendorInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        activeVendorFile = e.target.files[0];
        updateUploadBadge(vendorInput, `✓ Vendor: ${activeVendorFile.name}`);
      }
    });
  }
}

function updateUploadBadge(inputElement, labelText) {
  const parent = inputElement.parentElement;
  let label = parent.querySelector('.upload-status-badge') || parent.querySelector('.file-status-label');
  if (!label) {
    label = document.createElement('div');
    label.className = 'upload-status-badge';
    label.style.cssText = 'color: #38bdf8; font-size: 13px; margin-top: 6px; font-weight: 600;';
    parent.appendChild(label);
  }
  label.textContent = labelText;
}

// ==========================================
// 8. ONE-CLICK DEMO SCENARIO LOADER
// ==========================================
function initDemoLoader() {
  const demoBtn = document.getElementById('loadSampleBtn') || document.getElementById('loadDemoBtn');
  if (!demoBtn) return;

  demoBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const scenario = DEMO_SCENARIOS[demoScenarioIndex];

    activeRuleFiles = scenario.rules.map(r => new File([r.content], r.name, { type: 'text/plain' }));
    activeVendorFile = new File([scenario.vendor.content], scenario.vendor.name, { type: 'text/plain' });

    const ruleInput = document.getElementById('ruleFilesInput') || document.getElementById('ruleFiles');
    const vendorInput = document.getElementById('vendorFileInput') || document.getElementById('vendorFile');

    try {
      const dtRules = new DataTransfer();
      activeRuleFiles.forEach(f => dtRules.items.add(f));
      if (ruleInput) ruleInput.files = dtRules.files;

      const dtVendor = new DataTransfer();
      dtVendor.items.add(activeVendorFile);
      if (vendorInput) vendorInput.files = dtVendor.files;
    } catch {
      // Memory files handle payload safely
    }

    if (ruleInput) updateUploadBadge(ruleInput, `✓ Attached: ${activeRuleFiles.map(f => f.name).join(', ')}`);
    if (vendorInput) updateUploadBadge(vendorInput, `✓ Attached: ${activeVendorFile.name}`);

    alert(`Demo Scenario Loaded: ${scenario.name}\n\n• ${activeRuleFiles.length} Company Rulebooks attached\n• 1 Vendor Agreement attached\n\nClick 'Run Cross-Document Compliance Audit' to start.`);
  });
}

// ==========================================
// 9. AUDIT EXECUTION ENGINE (POINTING DIRECTLY TO RENDER)
// ==========================================
function initAuditExecution() {
  const runAuditBtn = document.getElementById('runAuditBtn') || document.getElementById('auditActionBtn');
  if (!runAuditBtn) return;

  runAuditBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const ruleInput = document.getElementById('ruleFilesInput') || document.getElementById('ruleFiles');
    const vendorInput = document.getElementById('vendorFileInput') || document.getElementById('vendorFile');

    let filesToAudit = [];
    if (activeRuleFiles.length > 0) {
      filesToAudit = activeRuleFiles;
    } else if (ruleInput && ruleInput.files && ruleInput.files.length > 0) {
      filesToAudit = Array.from(ruleInput.files);
    }

    let vendorDoc = activeVendorFile;
    if (!vendorDoc && vendorInput && vendorInput.files && vendorInput.files.length > 0) {
      vendorDoc = vendorInput.files[0];
    }

    if (filesToAudit.length === 0 && DEMO_SCENARIOS[0].rules.length > 0) {
      filesToAudit = DEMO_SCENARIOS[0].rules.map(r => new File([r.content], r.name, { type: 'text/plain' }));
    }
    if (!vendorDoc && DEMO_SCENARIOS[0].vendor) {
      vendorDoc = new File([DEMO_SCENARIOS[0].vendor.content], DEMO_SCENARIOS[0].vendor.name, { type: 'text/plain' });
    }

    const payloadFiles = filesToAudit.slice(0, 3);

    const formData = new FormData();
    payloadFiles.forEach(file => {
      formData.append('ruleFiles', file);
    });
    formData.append('vendorFile', vendorDoc);

    const origText = runAuditBtn.textContent;
    runAuditBtn.disabled = true;
    runAuditBtn.textContent = '⏳ Running Groq 120B Live Audit...';

    const spinner = document.getElementById('auditSpinner') || document.getElementById('auditLoading');
    if (spinner) {
      spinner.classList.remove('hidden');
      spinner.style.display = 'block';
    }

    try {
      // Direct call to Live Render Backend API (No localhost)
      const response = await fetch(`${API_BASE_URL}/api/audit-multi`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const auditData = await response.json();
      currentAuditResult = auditData;
      renderAuditDashboard(auditData);

    } catch (err) {
      console.error('Audit Error:', err);
      alert(`Audit Exception: ${err.message}\n(Backend waking up. Please wait 15s and click again).`);
    } finally {
      runAuditBtn.disabled = false;
      runAuditBtn.textContent = origText;
      if (spinner) {
        spinner.classList.add('hidden');
        spinner.style.display = 'none';
      }
    }
  });
}

// ==========================================
// 10. DASHBOARD RENDERING (TRAFFIC-LIGHT)
// ==========================================
function renderAuditDashboard(data) {
  const dashboard = document.getElementById('dashboardSection') || document.getElementById('auditDashboard');
  const emptyState = document.getElementById('emptyState');

  if (dashboard) {
    dashboard.classList.remove('hidden');
    dashboard.style.display = 'block';
  }

  if (emptyState) {
    emptyState.classList.add('hidden');
    emptyState.style.display = 'none';
  }

  const scoreEl = document.getElementById('scoreValue') || document.getElementById('overallScore');
  const summaryEl = document.getElementById('summaryText');

  const greenPctEl = document.getElementById('greenPct') || document.getElementById('greenStat');
  const greenCountEl = document.getElementById('greenCount');

  const yellowPctEl = document.getElementById('yellowPct') || document.getElementById('yellowStat');
  const yellowCountEl = document.getElementById('yellowCount');

  const redPctEl = document.getElementById('redPct') || document.getElementById('redStat');
  const redCountEl = document.getElementById('redCount');

  if (scoreEl) scoreEl.textContent = `${data.overall_score}%`;
  if (summaryEl) summaryEl.textContent = data.summary;

  if (greenPctEl) greenPctEl.textContent = `${data.stats.green_percentage}%`;
  if (greenCountEl) greenCountEl.textContent = `${data.stats.green_count} permissions`;

  if (yellowPctEl) yellowPctEl.textContent = `${data.stats.yellow_percentage}%`;
  if (yellowCountEl) yellowCountEl.textContent = `${data.stats.yellow_count} permissions`;

  if (redPctEl) redPctEl.textContent = `${data.stats.red_percentage}%`;
  if (redCountEl) redCountEl.textContent = `${data.stats.red_count} permissions`;

  const barGreen = document.getElementById('barGreen');
  const barYellow = document.getElementById('barYellow');
  const barRed = document.getElementById('barRed');

  if (barGreen) barGreen.style.width = `${data.stats.green_percentage}%`;
  if (barYellow) barYellow.style.width = `${data.stats.yellow_percentage}%`;
  if (barRed) barRed.style.width = `${data.stats.red_percentage}%`;

  const findings = data.findings || [];
  const countAll = document.getElementById('countAll');
  const countRed = document.getElementById('countRed');
  const countYellow = document.getElementById('countYellow');
  const countGreen = document.getElementById('countGreen');

  if (countAll) countAll.textContent = findings.length;
  if (countRed) countRed.textContent = findings.filter(f => f.signal === 'RED').length;
  if (countYellow) countYellow.textContent = findings.filter(f => f.signal === 'YELLOW').length;
  if (countGreen) countGreen.textContent = findings.filter(f => f.signal === 'GREEN').length;

  renderFindingCards(findings);
  initArtifactActions();

  if (dashboard) dashboard.scrollIntoView({ behavior: 'smooth' });
}

function renderFindingCards(findingsList) {
  const container = document.getElementById('resultsContainer') || document.getElementById('findingsContainer');
  if (!container) return;

  container.innerHTML = '';

  findingsList.forEach(f => {
    const card = document.createElement('div');
    const signal = (f.signal || 'RED').toUpperCase();
    
    // Border colors based on signal
    let borderColor = '#ef4444'; // Red (Conflict)
    let badgeText = 'CONFLICT';
    let badgeBg = 'rgba(239, 68, 68, 0.2)';
    let badgeColor = '#f87171';

    if (signal === 'YELLOW' || f.verdict === 'CAUTION') {
      borderColor = '#f59e0b';
      badgeText = 'CAUTION';
      badgeBg = 'rgba(245, 158, 11, 0.2)';
      badgeColor = '#fbbf24';
    } else if (signal === 'GREEN' || f.verdict === 'COMPLIANT') {
      borderColor = '#10b981';
      badgeText = 'COMPLIANT';
      badgeBg = 'rgba(16, 185, 129, 0.2)';
      badgeColor = '#34d399';
    }

    // Outer card styling exactly matching your screenshot
    card.style.cssText = `
      background-color: #0b1120;
      border: 1px solid #1e293b;
      border-left: 4px solid ${borderColor};
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
    `;
    card.setAttribute('data-signal', signal);

    card.innerHTML = `
      <!-- Header row: Clause Title + Badges -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-weight: 700; font-size: 14px; letter-spacing: 0.5px; color: #ffffff; text-transform: uppercase;">
          ${f.title || f.id || 'AUDIT CLAUSE'}
        </span>
        <div style="display: flex; gap: 8px;">
          <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
            ${badgeText}
          </span>
          <span style="background: #1e293b; color: #94a3b8; font-size: 11px; padding: 2px 8px; border-radius: 4px;">
            explicitly stated
          </span>
        </div>
      </div>

      <!-- Vendor Permission Clause Text -->
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin: 0 0 12px 0;">
        "${f.vendor_request || ''}"
      </p>

      <!-- Finding description -->
      <p style="font-size: 13px; line-height: 1.5; margin: 0 0 14px 0; color: #f1f5f9;">
        <strong style="color: #ffffff;">Finding:</strong> ${f.simple_why || f.decision_advice || ''}
      </p>

      <!-- Blue Box: Policy Citation -->
      <div style="background-color: rgba(14, 116, 144, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); border-left: 3px solid #0284c7; border-radius: 4px; padding: 10px 14px; margin-bottom: 12px;">
        <div style="color: #38bdf8; font-weight: 700; font-size: 12px; margin-bottom: 4px;">
          Policy Citation (${f.rule_reference || 'Internal Policy'}):
        </div>
        <div style="color: #cbd5e1; font-size: 12px; line-height: 1.5;">
          "${f.rule_quote || 'Standard policy requirement applies.'}"
        </div>
      </div>

      <!-- Amber/Brown Box: Suggested Redline Amendment -->
      ${f.replacement_clause ? `
        <div style="background-color: rgba(180, 83, 9, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); border-left: 3px solid #d97706; border-radius: 4px; padding: 10px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #f59e0b; font-weight: 700; font-size: 12px;">Suggested Redline Amendment:</span>
            <button type="button" onclick="copyRedlineText(this, \`${f.replacement_clause.replace(/`/g, "\\`")}\`)" style="background: transparent; border: 1px solid #78350f; color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">📋 Copy</button>
          </div>
          <div style="color: #e2e8f0; font-size: 12px; line-height: 1.5;">
            ${f.replacement_clause}
          </div>
        </div>
      ` : ''}
    `;

    container.appendChild(card);
  });
}

// ==========================================
// 11. TAB FILTERING (ALL / RED / YELLOW / GREEN)
// ==========================================
function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab, .tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter') || 'ALL';
      const cards = document.querySelectorAll('.audit-card');

      cards.forEach(card => {
        const sig = card.getAttribute('data-signal');
        if (filter === 'ALL' || sig === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ==========================================
// 12. EXPORT ACTIONS (REDLINE COPY, NOTICE & PDF)
// ==========================================
window.copyRedlineText = function(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = prev; }, 1800);
  });
};

function initArtifactActions() {
  const emailBtn = document.getElementById('copyEmailBtn') || document.getElementById('generateEmailBtn');
  const pdfBtn = document.getElementById('downloadPdfBtn') || document.getElementById('exportPdfBtn');

  if (emailBtn && currentAuditResult) {
    emailBtn.onclick = (e) => {
      e.preventDefault();
      const redItems = (currentAuditResult.findings || []).filter(f => f.signal === 'RED');
      const emailBody = `Subject: Legal & Compliance Counter-Notice: Revisions Required

Dear Vendor Legal Team,

Our automated compliance audit identified ${redItems.length} critical policy non-compliances in your submitted agreement.

Below are the mandatory redline replacement clauses required for execution:

${redItems.map((r, i) => `${i + 1}. [${r.title}]\n- Vendor Request: "${r.vendor_request}"\n- Mandatory Clause: "${r.replacement_clause}"\n- Reason: ${r.simple_why}`).join('\n\n')}

Please review and confirm acceptance of these redline clauses.

Sincerely,
Corporate Compliance & Risk Governance Team`;

      navigator.clipboard.writeText(emailBody).then(() => {
        alert('Lawyer-ready counter-notice email copied to clipboard!');
      });
    };
  }

  if (pdfBtn) {
    pdfBtn.onclick = (e) => {
      e.preventDefault();
      window.print();
    };
  }
}