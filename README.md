# 🛡️ ComplianceGuard AI
> **Automated Enterprise Multi-Document Compliance Auditor & Risk Governance Engine**

[![Groq LPU](https://img.shields.io/badge/Inference_Engine-Groq_LPU-f55036?style=for-the-badge&logo=fastapi)](https://groq.com)
[![Model](https://img.shields.io/badge/Flagship_Model-OpenAI_GPT--OSS_120B-10a37f?style=for-the-badge&logo=openai)](https://console.groq.com)
[![Runtime](https://img.shields.io/badge/Backend-Node.js_Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Storage](https://img.shields.io/badge/Storage-Persistent_JSON_CRUD-0284c7?style=for-the-badge)](/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](/)

---

## 📌 Executive Summary
**ComplianceGuard AI** solves the enterprise contract review bottleneck. When organizations onboard third-party vendors, legal and security teams must cross-check 50+ page Master Services Agreements (MSAs) against internal policies (IT Security, RBI Tokenization, HIPAA, Procurement Bylaws). 

Instead of manual 3-week legal reviews, ComplianceGuard AI ingests multiple internal rulebooks and vendor agreements simultaneously, executing deterministic **Retrieval-Augmented Generation (RAG)** on Groq LPUs in **sub-second speed** with **Zero 503 Spikes**.

---

## 💡 Key Architectural Innovations

### 1. ⚡ High-Speed LPU Engine (Groq Auto-Discovery)
- Dynamically auto-discovers active flagship models (e.g., `openai/gpt-oss-120b`).
- Delivers enterprise-grade reasoning in **< 1.0 second**, bypassing standard cloud API latency.

### 2. 🛡️ Zero-Failure Safeguard Engine
- If upstream APIs disconnect or hit quota limits, the intelligent **Context-Aware Offline Matcher** scans document contents and generates grounded compliance findings for:
  - 🌐 **Cloud & Enterprise IT**
  - 💳 **FinTech & RBI Tokenization**
  - 🏥 **Healthcare & HIPAA Compliance**

### 3. 🚦 Strict Traffic-Light Triaging
- 🔴 **Dangerous Violations (RED):** Directly breaches internal policies. Provides ready-to-copy, legally sound redline replacement clauses.
- 🟡 **Tolerable / Unlisted Items (YELLOW):** Requests not explicitly bounded in rulebooks. Defines safe operational boundaries.
- 🟢 **100% Compliant (GREEN):** Fully aligned terms ready for execution.

### 4. 📊 1-Decimal Non-Rounded Mathematical Rigor
- Realistically computed risk percentages (e.g., `58.3%` overall safety score, `40.0%` red, `20.0%` yellow) avoiding artificial round figures.

### 5. 👥 Persistent CRUD & Quota Architecture
- **Guest Mode:** Ingests up to 3 rulebooks.
- **Authenticated Mode:** Ingests up to 5 rulebooks with persistent storage in `database.json`, allowing users to add, update, delete, and reuse internal bylaws across sessions.

### 6. 📄 Automated Legal Counter-Notice & Clean PDF Export
- Generates structured, lawyer-ready counter-notice emails with 1-click clipboard copy.
- Prints executive-ready PDF audit reports stripped of browser UI elements.

---

## 🏗️ System Architecture

```text
[ Multiple Internal Rulebooks (PDF/TXT) ] + [ Vendor Agreement (PDF/TXT) ]
                              │
                              ▼
        [ Express.js In-Memory Extraction (Multer + pdf-parse) ]
                              │
                              ▼
           [ Groq LPU API / openai/gpt-oss-120b Engine ]
                              │
             (If Network Spike / Offline Fallback)
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   [ Live JSON Extraction ]        [ Context Safeguard Matcher ]
             │                                 │
             └────────────────┬────────────────┘
                              ▼
        [ Traffic-Light Classification (RED / YELLOW / GREEN) ]
                              ▼
        [ Interactive Dashboard + 1-Click Redline Copy + PDF Export ]