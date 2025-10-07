# ⚖️ Contract Intelligence Engine  
**AI-Powered Legal Document Understanding with Multi-Step Reasoning & Citation Verification**

---

### 🧭 Overview

**Contract Intelligence Engine (CIE)** is a next-generation **LegalTech solution** that automates the analysis of complex contracts using **multi-agent reasoning, retrieval-augmented generation (RAG)**, and **citation verification**.  

It extracts **obligations, deadlines, and risks**, flags **ambiguous clauses**, and generates **comparison reports** across similar agreements — empowering legal teams to make faster, data-backed decisions.

---

### 🚀 Value Proposition

- 📄 **Contract Intelligence:** Automatically extract obligations, deadlines, and high-risk clauses.  
- 🧠 **Reasoning & Context:** Multi-step AI reasoning over contract sections for accurate interpretations.  
- 🪶 **Citation Validation:** Verify AI outputs with reference to original clauses.  
- 🧾 **Comparative Analysis:** Generate clause-by-clause comparison across NDAs, MSAs, and employment contracts.  
- 💡 **Explainable AI:** Transparent reasoning trail with traceable evidence for every output.  

---

### 🏗️ Architecture

**Tech Stack Overview**

| Layer | Technology | Description |
|:------|:------------|:-------------|
| **Frontend** | [Next.js 14 (App Router)](https://nextjs.org/) | Modern React-based interface with server actions |
| **Backend API** | [Node.js + Fastify](https://fastify.dev/) | High-performance, low-latency API framework |
| **Database** | [Supabase Postgres + pgvector](https://supabase.com/) | Contract storage + vector embeddings |
| **Queue System** | [Redis + BullMQ](https://docs.bullmq.io/) | Asynchronous task management & concurrency control |
| **File Storage** | [MinIO / AWS S3](https://min.io/) | Secure storage for contract PDFs |
| **LLM Orchestration** | [OpenAI](https://openai.com/) + [Anthropic](https://www.anthropic.com/) | Multi-model reasoning engine |
| **OCR Pipeline** | Tesseract / Cloud OCR API | Streaming OCR for scanned PDFs up to 50MB |

---

### 🧩 AI Strategy

**Agentic Workflow — Multi-Tool Reasoning System**

1. 🔍 **Clause Extractor Tool**  
   - Extracts key contract clauses (obligations, risks, payment terms).  
   - Embeds sections (chunk size: 512 tokens, overlap: 50).  

2. ⚖️ **Legal DB Lookup Tool**  
   - Retrieves precedents and verified clauses from legal knowledge base.  
   - RAG over embedded sections using pgvector similarity search.  

3. 🧮 **Risk Scorer Tool**  
   - Quantifies contractual risk across clauses (e.g., liability caps, termination rights).  
   - Re-ranks citations by relevance and confidence score.  

---

### 📊 Evaluation Metrics

| Metric | Description | Target |
|:--------|:-------------|:--------|
| **RAGAS Faithfulness** | Citation accuracy | > **0.85** |
| **Answer Relevancy** | Context alignment | > **0.80** |
| **Latency (p95)** | End-to-end processing | < **8s/document** |
| **Cost Budget** | API + Compute per document | ≤ **$0.12** |
| **Golden Test Set** | 50 annotated samples (NDAs, MSAs, Employment) | 100% coverage |

---

### ⚙️ System Design Highlights

- 🧾 **Streaming OCR for Large PDFs:** Handles documents up to 50MB efficiently.  
- ♻️ **Idempotent Job Design:** Deduplication via SHA-256 hash ensures retry safety.  
- 🔁 **Partial Recovery:** Intermediate extractions stored to resume failed jobs.  
- 🧱 **Pagination:** Cursor-based listing (20 docs/page) for smooth frontend UX.  
- 🧵 **Backpressure Control:**  
  - BullMQ concurrency: 5  
  - API rate limit: 10 requests/sec/user  

---

### 🧠 Workflow Diagram (Conceptual)

            ┌──────────────────────┐
            │     PDF Upload       │
            └──────────┬───────────┘
                       │
                       ▼
             ┌──────────────────┐
             │  Streaming OCR    │
             └────────┬─────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │  Agentic Reasoning Loop        │
       │  ├─ Clause Extractor           │
       │  ├─ Legal DB Lookup (RAG)      │
       │  └─ Risk Scorer + Citation     │
       └───────────────────────────────┘
                       │
                       ▼
           ┌────────────────────────┐
           │  Structured Insights    │
           │ (Obligations, Risks...) │
           └──────────┬─────────────┘
                       │
                       ▼
              📊 Frontend Dashboard

---

### 🧪 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/contract-intelligence-engine.git
cd contract-intelligence-engine

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local

# Start all services
docker-compose up -d

# Run development servers
pnpm run dev:api
pnpm run dev:web
```
### 🧩 Example Use Cases
| Scenario            | Output                                                              |
| :------------------ | :------------------------------------------------------------------ |
| NDA Review          | Identifies confidentiality duration, exclusions, and governing law. |
| MSA Comparison      | Flags deviations from master templates.                             |
| Employment Contract | Detects non-compete or unfair termination risks.                    |

### 🧰 Tech Stack Badges

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)
![Fastify](https://img.shields.io/badge/Fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-%233FCF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai)
![Anthropic](https://img.shields.io/badge/Anthropic-%23000000.svg?style=for-the-badge)
![BullMQ](https://img.shields.io/badge/BullMQ-%23E34F26.svg?style=for-the-badge)
![MinIO](https://img.shields.io/badge/MinIO-%23C72E49.svg?style=for-the-badge)


