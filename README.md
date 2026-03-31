# CloudAutopsy

**Forensic analysis of real-world cloud security breaches.**

*Attack paths. Root causes. Detection gaps.*

An interactive visualization of 15 verified cloud security incidents — reconstructed from public court documents, SEC filings, and official company post-mortems. Every attack path is sourced. Every detection gap is an honest assessment of what controls were missing.

**[Live →](#)** *(add URL after deployment)*

---

## What you can explore

- **Breach cards** — filter by cloud provider, year, and severity
- **Attack path** — step-by-step reconstruction of how each breach unfolded
- **Root cause** — what actually went wrong
- **What would have caught it** — the specific controls that were absent
- **Technique map** — which attack techniques repeat across multiple breaches

---

## Data

15 breaches spanning 2016–2025. Sources include US DOJ criminal complaints, SEC 8-K filings, FTC settlement documents, and official company security advisories. No secondary media used as a source.

Techniques mapped to [MITRE ATT&CK for Enterprise — Cloud (IaaS)](https://attack.mitre.org/matrices/enterprise/cloud/).

---

## Run locally

1. Install Node.js (LTS)
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Optional environment variables

Create `.env.local` only if needed:

```bash
VITE_REQUIRE_AUTH=false
VITE_LOGIN_URL=/login
```
