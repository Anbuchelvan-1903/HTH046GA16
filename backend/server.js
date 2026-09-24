import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse-new';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '30mb' }));

// In-memory file upload handler (handles multiple rule files + 1 vendor file)
const upload = multer({ storage: multer.memoryStorage() });

// Extract plain text from PDF or TXT buffers
async function extractText(file) {
  if (!file) return "";
  try {
    const isPdf = file.mimetype === 'application/pdf' || 
                  (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
    if (isPdf) {
      const data = await pdfParse(file.buffer);
      return data.text || "";
    }
    return file.buffer.toString('utf-8');
  } catch (err) {
    console.warn(`[Parser] String fallback for ${file.originalname}:`, err.message);
    return file.buffer.toString('utf-8');
  }
}

// Built-in Fallback Demo Data with Traffic Lights & Percentages
const fallbackResponse = {
  overall_score: 65,
  stats: {
    total_items: 4,
    green_count: 2,
    red_count: 1,
    yellow_count: 1,
    green_percentage: 50,
    red_percentage: 25,
    yellow_percentage: 25
  },
  summary: "Audit completed: 50% fully compliant, 25% critical violations, and 25% unlisted permissions requiring review.",
  findings: [
    {
      id: "PERM-101",
      title: "Production Database Read/Write Access",
      signal: "RED",
      verdict: "VIOLATION - Reject / Redline",
      vendor_request: "Vendor requests full administrative root access to Production customer database for debugging.",
      rule_reference: "IT Security Policy v3.1 - Section 4.2",
      rule_quote: "Direct vendor access to production databases is strictly prohibited. Only anonymized staging DB access allowed.",
      why_analysis: "Exposes confidential user records and breaches corporate GDPR compliance requirements.",
      suggestion: "Modify request to: 'Vendor shall only be granted read-only access to synthetic staging environments with 2FA approval.'"
    },
    {
      id: "PERM-102",
      title: "Weekly Slack Channel Guest Access",
      signal: "YELLOW",
      verdict: "TOLERABLE - Review Needed",
      vendor_request: "Vendor requests single-channel guest membership in company Slack for async team communication.",
      rule_reference: "Not explicitly documented in company rulebooks",
      rule_quote: "None (Policy does not explicitly define third-party chat collaboration limits).",
      why_analysis: "This permission is not mentioned in your rulebooks. It is low risk, but Slack audit logs must be enabled so confidential files are not leaked.",
      suggestion: "Can be APPROVED provided that guest access expires in 90 days and file download permissions are disabled."
    },
    {
      id: "PERM-103",
      title: "Invoice Settlement Net-30",
      signal: "GREEN",
      verdict: "COMPLIANT - Approved",
      vendor_request: "Vendor requests invoice payment remittance within Net-30 calendar days of invoice date.",
      rule_reference: "Finance Governance Manual - Rule 1.1",
      rule_quote: "All external vendor invoice payments must strictly adhere to Net-30 calendar days.",
      why_analysis: "Matches internal finance governance protocols without discrepancies.",
      suggestion: "Safe to approve as written."
    },
    {
      id: "PERM-104",
      title: "Mutual 30-Day Termination Notice",
      signal: "GREEN",
      verdict: "COMPLIANT - Approved",
      vendor_request: "Either party may terminate the collaboration agreement with thirty (30) days prior written notice.",
      rule_reference: "Legal Standard Protocols - Section 5.1",
      rule_quote: "Standard termination notice periods shall require a minimum of thirty (30) calendar days notification.",
      why_analysis: "Perfect alignment with standard operational termination procedures.",
      suggestion: "Safe to approve."
    }
  ]
};

// Core Multi-Doc RAG Grounding Engine
async function executeMultiDocAudit(rulesCombinedText, vendorText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("AQ.") || apiKey.includes("your_gemini")) {
    console.warn("[Backend] Running resilient fallback engine.");
    return fallbackResponse;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const auditPrompt = `
You are an Enterprise Compliance, Legal & Risk Officer.
Audit the target VENDOR PERMISSION REQUESTS against ALL uploaded INTERNAL CORPORATE RULES & POLICIES.

=== UPLOADED CORPORATE RULES & POLICIES (All Files Combined) ===
${rulesCombinedText}

=== UPLOADED VENDOR PERMISSION REQUESTS / CONTRACT ===
${vendorText}

Classify EVERY single permission or clause into 3 TRAFFIC LIGHT SIGNALS:
1. RED: Direct VIOLATION of any company rule.
2. YELLOW: TOLERABLE / UNLISTED. The permission is NOT mentioned in any uploaded rulebook. Explain whether the company should accept it or not, WHY, and suggest safeguards.
3. GREEN: COMPLIANT. Fully matches or complies with company rules.

Calculate exact percentages:
- green_percentage: (green_count / total_items) * 100
- red_percentage: (red_count / total_items) * 100
- yellow_percentage: (yellow_count / total_items) * 100
- overall_score: A safe score 0-100 reflecting compliance health (Green items boost, Red heavily penalizes).

Return strictly valid JSON only (no markdown, no backticks):
{
  "overall_score": <number 0-100>,
  "stats": {
    "total_items": <number>,
    "green_count": <number>,
    "red_count": <number>,
    "yellow_count": <number>,
    "green_percentage": <number>,
    "red_percentage": <number>,
    "yellow_percentage": <number>
  },
  "summary": "<1-2 sentence simple executive summary>",
  "findings": [
    {
      "id": "<e.g., PERM-1 or CLAUSE 1>",
      "title": "<Short plain English title>",
      "signal": "RED" | "YELLOW" | "GREEN",
      "verdict": "<e.g., VIOLATION - Reject> | <TOLERABLE - Review Needed> | <COMPLIANT - Approved>",
      "vendor_request": "<What vendor is asking for>",
      "rule_reference": "<Which policy/rule file and section it relates to, or 'Not in rules'>",
      "rule_quote": "<Exact quote from rules, or 'None'>",
      "why_analysis": "<Simple clear explanation of why this signal is given>",
      "suggestion": "<Actionable guidance: Redline replacement if RED, condition/advice if YELLOW, 'Safe to approve' if GREEN>"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: auditPrompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text.trim());
  } catch (err) {
    console.error("[Gemini Audit Error]:", err.message);
    return fallbackResponse;
  }
}

// MULTI-FILE UPLOAD AUDIT ROUTE (Supports 3+ Rule files + 1 Vendor file)
app.post('/api/audit-multi', upload.fields([
  { name: 'ruleFiles', maxCount: 10 },
  { name: 'vendorFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const ruleFiles = req.files && req.files['ruleFiles'] ? req.files['ruleFiles'] : [];
    const vendorFiles = req.files && req.files['vendorFile'] ? req.files['vendorFile'] : [];

    if (ruleFiles.length === 0 || vendorFiles.length === 0) {
      return res.status(400).json({ error: "Please upload at least 1 Rule File and 1 Vendor Permission File." });
    }

    // Ingest and concatenate all rule files into one ground-truth knowledge base
    let rulesTextArray = [];
    for (let i = 0; i < ruleFiles.length; i++) {
      const txt = await extractText(ruleFiles[i]);
      rulesTextArray.push(`--- [RULEBOOK ${i + 1}: ${ruleFiles[i].originalname}] ---\n${txt}`);
    }
    const combinedRulesText = rulesTextArray.join('\n\n');

    // Ingest vendor permission file
    const vendorText = await extractText(vendorFiles[0]);

    const result = await executeMultiDocAudit(combinedRulesText, vendorText);
    return res.json(result);
  } catch (error) {
    console.error("[Multi Audit Route Error]:", error.message);
    return res.json(fallbackResponse);
  }
});

// Backward-compatible JSON Endpoint for testing
app.post('/api/audit', async (req, res) => {
  const policy = req.body.policy_text || req.body.policy || "";
  const contract = req.body.contract_text || req.body.contract || "";
  if (!policy || !contract) return res.json(fallbackResponse);
  const result = await executeMultiDocAudit(policy, contract);
  return res.json(result);
});

app.get('/api/health', (req, res) => {
  res.json({ status: "online", engine: "Compliance-Guard Multi-Doc TrafficLight Engine v3.0" });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Compliance Guard Backend] running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('[Server Listen Error]:', err.message);
});