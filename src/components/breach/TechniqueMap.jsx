import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

export default function TechniqueMap({ breaches }) {
  const techniqueData = useMemo(() => {
    const techniques = {};
    
    breaches.forEach((breach) => {
      (breach.attack_techniques || []).forEach((technique) => {
        if (!techniques[technique]) {
          techniques[technique] = {
            name: technique,
            count: 0,
            companies: []
          };
        }
        techniques[technique].count += 1;
        if (!techniques[technique].companies.includes(breach.company)) {
          techniques[technique].companies.push(breach.company);
        }
      });
    });

    return Object.values(techniques).sort((a, b) => b.count - a.count);
  }, [breaches]);

  const maxCount = Math.max(...techniqueData.map((t) => t.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-[#f85149]" />
        <h2 className="text-lg font-semibold text-[#e6edf3]">
          Attack Technique Frequency
        </h2>
        <span className="text-sm text-[#8b949e]">
          ({techniqueData.length} unique techniques)
        </span>
      </div>

      <div className="space-y-3">
        {techniqueData.map((technique, index) => (
          <motion.div
            key={technique.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#484f58] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#e6edf3]">{technique.name}</h3>
              <span className="text-sm font-mono text-[#f85149]">
                {technique.count} {technique.count === 1 ? "breach" : "breaches"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-[#21262d] rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(technique.count / maxCount) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, #f85149, #d29922)`
                }}
              />
            </div>

            {/* Companies */}
            <div className="flex flex-wrap gap-2">
              {technique.companies.map((company) => (
                <span
                  key={company}
                  className="px-2 py-1 bg-[#21262d] text-[#8b949e] rounded text-xs"
                >
                  {company}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {techniqueData.length === 0 && (
        <div className="text-center py-12 text-[#8b949e]">
          No technique data available
        </div>
      )}
    </div>
  );
}