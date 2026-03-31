import React from "react";
import { ExternalLink } from "lucide-react";

const sections = [
  {
    title: "What this is",
    body: "An interactive reference for cloud security practitioners. Every entry is a real breach. Every attack path is reconstructed from a public, verifiable source (court documents, SEC filings, or official company post-mortems). No vendor content. No opinions. Documented incidents only."
  },
  {
    title: "Breach selection criteria",
    body: "Breaches were selected based on: (1) confirmed cloud infrastructure involvement, (2) existence of a public primary source, (3) educational value — each breach illustrates a distinct failure mode. The 11 entries collectively cover the most common cloud attack patterns from 2016–2023."
  },
  {
    title: "Attack technique taxonomy",
    body: null,
    custom: (
      <p className="text-[#8b949e] leading-relaxed">
        Techniques follow the{" "}
        <span className="text-[#e6edf3] font-medium">
          MITRE ATT&CK for Enterprise — Cloud (IaaS)
        </span>{" "}
        matrix. Each breach includes both human-readable technique names and formal MITRE technique IDs (e.g.,{" "}
        <code className="bg-[#21262d] text-[#79c0ff] px-1.5 py-0.5 rounded text-sm font-mono">
          T1552.005 — Unsecured Credentials: Cloud Instance Metadata API
        </code>
        ). Reference:{" "}
        <a
          href="https://attack.mitre.org/matrices/enterprise/cloud/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#58a6ff] hover:text-[#79c0ff] inline-flex items-center gap-1 transition-colors"
        >
          attack.mitre.org/matrices/enterprise/cloud
          <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    )
  },
  {
    title: "Sources standard",
    body: "All breach data is sourced from primary public records. Acceptable source types: US DOJ/FBI criminal complaints, SEC filings, FTC settlement documents, official company security advisories and post-mortems, and credible security research reports (e.g., UpGuard). Secondary media coverage is not used as a source."
  }
];

export default function AboutDataset() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#e6edf3] mb-1">About This Dataset</h2>
        <div className="h-px bg-[#30363d] mt-3" />
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-[#e6edf3] mb-2">{section.title}</h3>
          {section.custom ?? (
            <p className="text-[#8b949e] leading-relaxed">{section.body}</p>
          )}
        </div>
      ))}

      <div className="border-t border-[#30363d] pt-6">
        <p className="text-xs text-[#484f58]">
          Dataset version 1.0 · Last updated March 2026 · 11 verified incidents
        </p>
      </div>
    </div>
  );
}