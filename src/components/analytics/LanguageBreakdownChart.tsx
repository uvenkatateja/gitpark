/**
 * Language Breakdown Chart
 * Pie chart showing language distribution
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { LanguageStats } from '@/lib/analyticsService';

interface LanguageBreakdownChartProps {
  data: LanguageStats[];
  detailed?: boolean;
}

export default function LanguageBreakdownChart({ data, detailed = false }: LanguageBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">No language data available</p>
      </div>
    );
  }

  // Show top 8 languages, group rest as "Other"
  const displayData = data.slice(0, 8);
  const otherCount = data.slice(8).reduce((sum, lang) => sum + lang.count, 0);
  
  if (otherCount > 0) {
    displayData.push({
      language: 'Other',
      count: otherCount,
      percentage: Math.round((otherCount / data.reduce((sum, l) => sum + l.count, 0)) * 100),
      color: '#8b8b8b',
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-sm font-semibold text-foreground">{data.language}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.count} repos ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={detailed ? 400 : 250}>
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={detailed ? ({ language, percentage }) => `${language} ${percentage}%` : false}
            outerRadius={detailed ? 140 : 80}
            fill="#8884d8"
            dataKey="count"
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {detailed && <Legend />}
        </PieChart>
      </ResponsiveContainer>

      {/* Language list */}
      <div className="grid grid-cols-2 gap-2">
        {displayData.map((lang, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <span className="text-foreground truncate">{lang.language}</span>
            <span className="text-muted-foreground ml-auto">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
