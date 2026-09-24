const samplePolicy = `1. PAYMENT TERMS POLICY (Section 3.2):
All external vendor payment terms must strictly not exceed Net-30 days from invoice date. Net-60 or Net-90 terms are strictly prohibited without written CFO pre-approval.

2. DATA PRIVACY & GDPR RETENTION (Section 5.1):
Upon contract termination, all vendor-held company customer data must be permanently purged within thirty (30) calendar days, accompanied by an executive certificate of destruction.

3. GOVERNING LAW & JURISDICTION (Section 9.4):
All contracts must be governed by the laws of the State of Delaware, and disputes shall be resolved in Delaware courts.`;

const sampleContract = `CLAUSE 4.1 - INVOICING & PAYMENT:
Company agrees to remit payment for all undisputed invoices within Net-90 calendar days following the receipt of invoice.

CLAUSE 8.2 - TERMINATION NOTICE:
Either party may terminate this agreement at any time with thirty (30) days prior written notice.

CLAUSE 12.4 - ARCHIVAL & BACKUP STORAGE:
Upon termination of this agreement, Vendor may retain anonymized customer records in cold storage backup archives for up to 180 days for disaster recovery compliance.

CLAUSE 16.1 - GOVERNING LAW:
This agreement shall be governed by, and construed in accordance with, the laws of the State of California.`;

document.getElementById("loadSampleBtn").addEventListener("click", () => {
  document.getElementById("policyInput").value = samplePolicy;
  document.getElementById("contractInput").value = sampleContract;
});

document.getElementById("runAuditBtn").addEventListener("click", async () => {
  const policyText = document.getElementById("policyInput").value.trim();
  const contractText = document.getElementById("contractInput").value.trim();
  const container = document.getElementById("resultsContainer");
  const loader = document.getElementById("loader");
  const emptyState = document.getElementById("emptyState");
  const stats = document.getElementById("summaryStats");

  if (!policyText || !contractText) {
    alert("Please provide both Corporate Policy text and Target Contract clauses.");
    return;
  }

  emptyState.classList.add("hidden");
  loader.classList.remove("hidden");
  container.innerHTML = "";
  stats.innerHTML = "";

  try {
    const response = await fetch("http://localhost:8000/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_text: contractText, policy_text: policyText }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status code: ${response.status}`);
    }

    const data = await response.json();
    loader.classList.add("hidden");

    stats.innerHTML = `
      Total Clauses: <strong>${data.total_clauses}</strong> | 
      <span style="color:#ef4444;">Conflicts: <strong>${data.conflicts_detected}</strong></span>
    `;

    data.results.forEach((item) => {
      const card = document.createElement("div");
      card.className = `card ${item.status}`;

      card.innerHTML = `
        <div class="card-header">
          <strong>${item.clause_id}</strong>
          <div class="badge-row">
            <span class="badge ${item.status}">${item.status}</span>
            <span class="confidence-tag">${item.confidence.replace("_", " ")}</span>
          </div>
        </div>

        <div class="clause-text">
          "${item.clause_text}"
        </div>

        <div class="explanation">
          <strong>Finding:</strong> ${item.explanation}
        </div>

        ${
          item.policy_quote && item.policy_quote !== "N/A"
            ? `<div class="quote-box">
                 <strong>Policy Citation (${item.policy_reference}):</strong><br/>
                 "${item.policy_quote}"
               </div>`
            : ""
        }

        ${
          item.suggested_redline
            ? `<div class="redline-box">
                 <strong>Suggested Redline Amendment:</strong><br/>
                 ${item.suggested_redline}
               </div>`
            : ""
        }
      `;

      container.appendChild(card);
    });
  } catch (error) {
    loader.classList.add("hidden");
    emptyState.classList.remove("hidden");
    alert("Connection Error: " + error.message + "\nEnsure the backend server is running on port 8000.");
  }
});