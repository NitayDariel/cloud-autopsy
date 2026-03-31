import React, { useMemo } from "react";
import { Database, Target, Cloud, Calendar } from "lucide-react";

function formatNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function StatsBar({ breaches }) {
  const stats = useMemo(() => {
    if (!breaches.length) {
      return {
        totalRecords: 0,
        mostCommonTechnique: { name: "N/A", count: 0 },
        mostTargetedProvider: { name: "N/A", count: 0 },
        yearRange: "N/A"
      };
    }

    // Total records
    const totalRecords = breaches.reduce((sum, b) => sum + (b.records_affected || 0), 0);

    // Most common technique
    const techniqueCounts = {};
    breaches.forEach((b) => {
      (b.attack_techniques || []).forEach((t) => {
        techniqueCounts[t] = (techniqueCounts[t] || 0) + 1;
      });
    });
    const topTechnique = Object.entries(techniqueCounts).sort((a, b) => b[1] - a[1])[0];

    // Most targeted provider
    const providerCounts = {};
    breaches.forEach((b) => {
      if (b.cloud_provider) {
        providerCounts[b.cloud_provider] = (providerCounts[b.cloud_provider] || 0) + 1;
      }
    });
    const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];

    // Year range
    const years = breaches.map((b) => b.year).filter(Boolean);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    return {
      totalRecords,
      mostCommonTechnique: topTechnique ? { name: topTechnique[0], count: topTechnique[1] } : { name: "N/A", count: 0 },
      mostTargetedProvider: topProvider ? { name: topProvider[0], count: topProvider[1] } : { name: "N/A", count: 0 },
      yearRange: minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`
    };
  }, [breaches]);

  const statItems = [
    {
      icon: Database,
      label: "Total Records Exposed",
      value: formatNumber(stats.totalRecords),
      color: "#f85149"
    },
    {
      icon: Target,
      label: "Top Attack Technique",
      value: stats.mostCommonTechnique.name,
      subValue: `${stats.mostCommonTechnique.count} breaches`,
      color: "#d29922"
    },
    {
      icon: Cloud,
      label: "Most Targeted Provider",
      value: stats.mostTargetedProvider.name,
      subValue: `${stats.mostTargetedProvider.count} breaches`,
      color: stats.mostTargetedProvider.name === "AWS" ? "#ff9900" : 
             stats.mostTargetedProvider.name === "Azure" ? "#0078d4" : "#4285f4"
    },
    {
      icon: Calendar,
      label: "Year Range",
      value: stats.yearRange,
      color: "#8b949e"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#484f58] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            <span className="text-xs text-[#8b949e] uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <div className="text-xl font-bold text-[#e6edf3] truncate">{stat.value}</div>
          {stat.subValue && (
            <div className="text-xs text-[#8b949e] mt-1">{stat.subValue}</div>
          )}
        </div>
      ))}
    </div>
  );
}