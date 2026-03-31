import React, { useMemo } from "react";

const TACTIC_ORDER = [
  "Reconnaissance",
  "Initial Access",
  "Credential Access",
  "Defense Evasion",
  "Lateral Movement",
  "Discovery",
  "Collection",
  "Exfiltration"
];

const TACTIC_COLORS = {
  "Reconnaissance":    "#6e7681",
  "Initial Access":    "#f0883e",
  "Credential Access": "#f85149",
  "Defense Evasion":   "#d2a8ff",
  "Lateral Movement":  "#ff7b72",
  "Discovery":         "#79c0ff",
  "Collection":        "#56d364",
  "Exfiltration":      "#ffa657"
};

const CONTROL_GROUPS = [
  { label: "MFA Enforcement",                   keywords: ["mfa", "multi-factor", "two-factor"] },
  { label: "IAM Least Privilege",               keywords: ["iam", "least privilege", "overpermission"] },
  { label: "Secret / Credential Scanning",      keywords: ["secret scanning", "secrets manager", "hardcoded", "credential"] },
  { label: "Anomaly Detection / Monitoring",    keywords: ["guardduty", "anomaly", "monitoring", "alert", "cloudtrail"] },
  { label: "OIDC / Short-lived Credentials",    keywords: ["oidc", "short-lived", "temporary credential"] },
  { label: "Network Policy / IP Restriction",   keywords: ["network policy", "ip restrict", "vpn egress"] },
  { label: "Endpoint Detection",                keywords: ["endpoint", "edr", "infostealer", "malware"] },
  { label: "Patch Management",                  keywords: ["patch", "cve", "vulnerability"] },
  { label: "SHA Pinning / Supply Chain",        keywords: ["sha", "pin", "supply chain"] }
];

export default function AttackIntelligence({ breaches }) {
  // ── Phase Map ────────────────────────────────────────────────────────────────
  const tacticMap = useMemo(() => {
    // Map: tacticName -> Map(techniqueId -> { id, name, companies[] })
    const map = {};
    for (const breach of breaches) {
      const techniques = breach.mitre_techniques;
      if (!Array.isArray(techniques)) continue;
      for (const t of techniques) {
        if (!t || !t.tactic) continue;
        const tactic = t.tactic;
        if (!map[tactic]) map[tactic] = new Map();
        const existing = map[tactic].get(t.id);
        if (existing) {
          if (!existing.companies.includes(breach.company)) {
            existing.companies.push(breach.company);
          }
        } else {
          map[tactic].set(t.id, { id: t.id, name: t.name, companies: [breach.company] });
        }
      }
    }
    return map;
  }, [breaches]);

  // ── Top Defensive Controls ────────────────────────────────────────────────
  const controlCounts = useMemo(() => {
    return CONTROL_GROUPS.map((group) => {
      let count = 0;
      for (const breach of breaches) {
        const items = breach.what_would_have_caught_it;
        if (!Array.isArray(items)) continue;
        const combined = items.join(" ").toLowerCase();
        if (group.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
          count++;
        }
      }
      return { label: group.label, count };
    }).sort((a, b) => b.count - a.count);
  }, [breaches]);

  const maxCount = controlCounts[0]?.count || 1;

  return (
    <div className="space-y-12">
      {/* ── Section 1: Attack Phase Map ─────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-[#e6edf3] mb-1">Attack Phases Across Case Studies</h2>
        <p className="text-sm text-[#8b949e] mb-6">
          Organized by MITRE ATT&CK tactic — not frequency counts
        </p>

        <div className="space-y-4">
          {TACTIC_ORDER.filter((tactic) => tacticMap[tactic]?.size > 0).map((tactic) => {
            const color = TACTIC_COLORS[tactic];
            const techniques = Array.from(tacticMap[tactic].values());
            return (
              <div
                key={tactic}
                className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
              >
                {/* Tactic header */}
                <div
                  className="px-4 py-2.5 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${color}`, backgroundColor: `${color}10` }}
                >
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color }}
                  >
                    {tactic}
                  </span>
                  <span className="text-xs text-[#484f58]">{techniques.length} technique{techniques.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Techniques */}
                <div className="divide-y divide-[#21262d]">
                  {techniques.map((t) => (
                    <div key={t.id} className="px-4 py-3 flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-[#e6edf3] font-medium">{t.name}</span>
                          <code className="text-xs font-mono bg-[#0d1117] text-[#79c0ff] px-1.5 py-0.5 rounded border border-[#30363d] flex-shrink-0">
                            {t.id}
                          </code>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                        {t.companies.map((company) => (
                          <span
                            key={company}
                            className="text-xs px-2 py-0.5 rounded-full border border-[#30363d] bg-[#21262d] text-[#8b949e]"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {TACTIC_ORDER.every((t) => !tacticMap[t]?.size) && (
            <div className="text-center py-12 text-[#484f58]">
              <p>No MITRE technique data available.</p>
              <p className="text-xs mt-1">Load a dataset with <code className="text-[#79c0ff]">mitre_techniques</code> containing a <code className="text-[#79c0ff]">tactic</code> field.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: Top Defensive Controls ───────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-[#e6edf3] mb-1">Controls That Appear Most Across Case Studies</h2>
        <p className="text-sm text-[#8b949e] mb-6">
          From "what would have caught it" — recommendations across {breaches.length} case studies, not a global frequency claim
        </p>

        <div className="space-y-3">
          {controlCounts.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-52 flex-shrink-0 text-sm text-[#8b949e] text-right leading-tight">
                {label}
              </div>
              <div className="flex-1 bg-[#161b22] rounded-full h-6 relative overflow-hidden border border-[#30363d]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: "#1f6feb"
                  }}
                />
              </div>
              <div className="w-44 flex-shrink-0 text-xs text-[#8b949e]">
                Recommended in <span className="font-bold text-[#e6edf3]">{count}</span> of {breaches.length} case studies
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}