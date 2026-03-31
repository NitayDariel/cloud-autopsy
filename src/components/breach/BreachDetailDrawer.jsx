import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, AlertTriangle, ExternalLink, ChevronRight, Copy, Check } from "lucide-react";

function buildCopyText(breach) {
  const line = (label, value) => value ? `${label}:\n${value}\n` : "";
  const list = (label, arr) => arr?.length ? `${label}:\n${arr.map((i, n) => `  ${n + 1}. ${i}`).join("\n")}\n` : "";
  const bullets = (label, arr) => arr?.length ? `${label}:\n${arr.map(i => `  • ${i}`).join("\n")}\n` : "";
  const tags = (label, arr) => arr?.length ? `${label}: ${arr.join(", ")}\n` : "";

  const records = !breach.records_affected
    ? "Credentials/Secrets stolen"
    : breach.records_affected >= 1e9
      ? (breach.records_affected / 1e9).toFixed(0) + "B records"
      : breach.records_affected >= 1e6
        ? (breach.records_affected / 1e6).toFixed(0) + "M records"
        : breach.records_affected >= 1e3
          ? (breach.records_affected / 1e3).toFixed(0) + "K records"
          : breach.records_affected + " records";

  return [
    `${"=".repeat(60)}`,
    `${breach.company.toUpperCase()} — ${breach.year}`,
    `Cloud: ${breach.cloud_provider}  |  Severity: ${breach.severity?.toUpperCase()}  |  ${records}  |  Sector: ${breach.sector}`,
    `${"=".repeat(60)}`,
    "",
    line("Summary", breach.summary),
    list("Attack Path", breach.attack_path),
    line("Root Cause", breach.root_cause),
    bullets("What Would Have Caught It", breach.what_would_have_caught_it),
    line("Detection Gap", breach.detection_gap),
    tags("Attack Techniques", breach.attack_techniques),
    tags("Cloud Services Involved", breach.services_involved),
    breach.financial_impact ? `Financial Impact:\n${breach.financial_impact}\n` : "",
    breach.reference ? `Reference (${breach.reference_type || "Link"}):\n${breach.reference}` : "",
    "",
    `${"=".repeat(60)}`,
  ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const providerColors = {
  AWS: { bg: "#ff9900", text: "#0d1117" },
  Azure: { bg: "#0078d4", text: "#ffffff" },
  GCP: { bg: "#4285f4", text: "#ffffff" },
  Snowflake: { bg: "#29b5e8", text: "#0d1117" },
  GitHub: { bg: "#6e40c9", text: "#ffffff" }
};

const severityColors = {
  critical: "#f85149",
  high: "#d29922",
  medium: "#8b949e"
};

function formatRecords(num) {
  if (num === 0 || num === null || num === undefined) {
    return "Credentials/Secrets stolen";
  }
  if (num >= 1000000000) return (num / 1000000000).toFixed(0) + "B records";
  if (num >= 1000000) return (num / 1000000).toFixed(0) + "M records";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K records";
  return num + " records";
}

export default function BreachDetailDrawer({ breach, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!breach) return null;

  const provider = providerColors[breach.cloud_provider] || providerColors.AWS;
  const severityColor = severityColors[breach.severity] || severityColors.medium;

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCopyText(breach));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {breach && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0d1117] border-l border-[#30363d] z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0d1117] border-b border-[#30363d] p-6 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#e6edf3] mb-2">
                    {breach.company}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8b949e]">{breach.year}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ backgroundColor: provider.bg, color: provider.text }}
                    >
                      {breach.cloud_provider}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${severityColor}20`, color: severityColor }}
                    >
                      {breach.severity}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      copied
                        ? "bg-[#3fb950]/20 border-[#3fb950]/40 text-[#3fb950]"
                        : "bg-[#21262d] border-[#30363d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
                    }`}
                    title="Copy incident as text"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm font-mono text-[#8b949e]">
                {formatRecords(breach.records_affected)} • {breach.sector}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Summary */}
              <p className="text-[#e6edf3] leading-relaxed">{breach.summary}</p>

              {/* Attack Path */}
              {breach.attack_path && breach.attack_path.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#f85149]" />
                    The Attack Path
                  </h3>
                  <div className="space-y-3">
                    {breach.attack_path.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f85149]/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#f85149]">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-[#e6edf3] text-sm leading-relaxed pt-1">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Root Cause */}
              {breach.root_cause && (
                <section>
                  <h3 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#d29922]" />
                    Root Cause
                  </h3>
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <p className="text-[#e6edf3] text-sm leading-relaxed">
                      {breach.root_cause}
                    </p>
                  </div>
                </section>
              )}

              {/* What Would Have Caught It */}
              {breach.what_would_have_caught_it && breach.what_would_have_caught_it.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#3fb950]" />
                    What Would Have Caught It
                  </h3>
                  <div className="space-y-2">
                    {breach.what_would_have_caught_it.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 bg-[#3fb950]/10 border border-[#3fb950]/30 rounded-lg p-3"
                      >
                        <Shield className="w-4 h-4 text-[#3fb950] flex-shrink-0 mt-0.5" />
                        <p className="text-[#e6edf3] text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Detection Gap */}
              {breach.detection_gap && (
                <section>
                  <h3 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wider mb-4">
                    Detection Gap
                  </h3>
                  <div className="bg-[#d29922]/10 border border-[#d29922]/30 rounded-lg p-4">
                    <p className="text-[#d29922] text-sm leading-relaxed">
                      {breach.detection_gap}
                    </p>
                  </div>
                </section>
              )}

              {/* Attack Techniques */}
              {breach.attack_techniques && breach.attack_techniques.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wider mb-4">
                    Attack Techniques
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {breach.attack_techniques.map((technique, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#f85149]/20 text-[#f85149] rounded-full text-xs font-medium"
                      >
                        {technique}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Services Involved */}
              {breach.services_involved && breach.services_involved.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wider mb-4">
                    Cloud Services Involved
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {breach.services_involved.map((service, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] text-[#8b949e] rounded-full text-xs font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Footer */}
              <div className="border-t border-[#30363d] pt-6 space-y-4">
                {breach.financial_impact && (
                  <div>
                    <span className="text-xs text-[#8b949e] uppercase tracking-wider">
                      Financial Impact
                    </span>
                    <p className="text-[#e6edf3] mt-1">{breach.financial_impact}</p>
                  </div>
                )}

                {breach.reference && (
                  <a
                    href={breach.reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-[#58a6ff] text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {breach.reference_type || "Reference"}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}