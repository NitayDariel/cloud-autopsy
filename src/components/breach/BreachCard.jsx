import React from "react";
import { motion } from "framer-motion";

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

export default function BreachCard({ breach, onClick }) {
  const provider = providerColors[breach.cloud_provider] || providerColors.AWS;
  const severityColor = severityColors[breach.severity] || severityColors.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 cursor-pointer hover:border-[#484f58] hover:shadow-lg hover:shadow-black/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-[#e6edf3] group-hover:text-white transition-colors">
          {breach.company}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold"
            style={{ backgroundColor: provider.bg, color: provider.text }}
          >
            {breach.cloud_provider}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-[#8b949e]">{breach.year}</span>
        <span className="w-1 h-1 rounded-full bg-[#30363d]"></span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${severityColor}20`, color: severityColor }}
        >
          {breach.severity}
        </span>
      </div>

      <div className="text-sm text-[#8b949e] mb-3 font-mono">
        {formatRecords(breach.records_affected)}
      </div>

      <p className="text-sm text-[#8b949e] line-clamp-2 leading-relaxed">
        {breach.summary}
      </p>

      <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between">
        <span className="text-xs text-[#484f58]">{breach.sector}</span>
        <span className="text-xs text-[#58a6ff] opacity-0 group-hover:opacity-100 transition-opacity">
          View details →
        </span>
      </div>
    </motion.div>
  );
}