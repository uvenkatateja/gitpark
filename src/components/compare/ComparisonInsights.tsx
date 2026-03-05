/**
 * Comparison Insights Component
 * Shows AI-generated insights about the comparison
 */

import { Lightbulb, TrendingUp, Award } from 'lucide-react';
import type { ComparisonSummary } from '@/lib/compareService';
import { getComparisonInsights } from '@/lib/compareService';

interface ComparisonInsightsProps {
  summary: ComparisonSummary;
}

export default function ComparisonInsights({ summary }: ComparisonInsightsProps) {
  const insights = getComparisonInsights(summary);

  if (insights.length === 0) return null;

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="font-pixel text-sm text-foreground">Key Insights</h3>
      </div>

      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="mt-0.5">
              {index === 0 ? (
                <Award className="w-4 h-4 text-yellow-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-primary" />
              )}
            </div>
            <p className="text-sm text-foreground flex-1">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
