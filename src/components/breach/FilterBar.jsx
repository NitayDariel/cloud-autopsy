import React from "react";
import { Slider } from "@/components/ui/slider";
import { Cloud, Filter } from "lucide-react";

const cloudProviders = [
  { value: "all", label: "All Providers" },
  { value: "AWS", label: "AWS", color: "#ff9900" },
  { value: "Azure", label: "Azure", color: "#0078d4" },
  { value: "GCP", label: "GCP", color: "#4285f4" },
  { value: "Snowflake", label: "Snowflake", color: "#29b5e8" },
  { value: "GitHub", label: "GitHub", color: "#6e40c9" }
];

const severities = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "Critical", color: "#f85149" },
  { value: "high", label: "High", color: "#d29922" },
  { value: "medium", label: "Medium", color: "#8b949e" }
];

export default function FilterBar({ filters, onFilterChange, yearRange }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4 text-[#8b949e]">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cloud Provider Filter */}
        <div>
          <label className="text-xs text-[#8b949e] uppercase tracking-wider mb-2 block">
            Cloud Provider
          </label>
          <div className="flex flex-wrap gap-2">
            {cloudProviders.map((provider) => (
              <button
                key={provider.value}
                onClick={() => onFilterChange("cloudProvider", provider.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  filters.cloudProvider === provider.value
                    ? provider.value === "all"
                      ? "bg-[#e6edf3] text-[#0d1117]"
                      : "text-[#0d1117]"
                    : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
                }`}
                style={{
                  backgroundColor:
                    filters.cloudProvider === provider.value && provider.value !== "all"
                      ? provider.color
                      : undefined
                }}
              >
                {provider.label}
              </button>
            ))}
          </div>
        </div>

        {/* Year Range Filter */}
        <div>
          <label className="text-xs text-[#8b949e] uppercase tracking-wider mb-2 block">
            Year Range: {filters.yearRange[0]} - {filters.yearRange[1]}
          </label>
          <div className="px-2 pt-2">
            <Slider
              value={filters.yearRange}
              onValueChange={(value) => onFilterChange("yearRange", value)}
              min={yearRange.min}
              max={yearRange.max}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="text-xs text-[#8b949e] uppercase tracking-wider mb-2 block">
            Severity
          </label>
          <div className="flex flex-wrap gap-2">
            {severities.map((severity) => (
              <button
                key={severity.value}
                onClick={() => onFilterChange("severity", severity.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  filters.severity === severity.value
                    ? severity.value === "all"
                      ? "bg-[#e6edf3] text-[#0d1117]"
                      : "text-white"
                    : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]"
                }`}
                style={{
                  backgroundColor:
                    filters.severity === severity.value && severity.value !== "all"
                      ? severity.color
                      : undefined
                }}
              >
                {severity.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}