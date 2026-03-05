/**
 * Contribution Heatmap
 * GitHub-style contribution calendar
 */

import { useMemo } from 'react';
import type { ContributionDay } from '@/lib/analyticsService';
import { getContributionColor } from '@/lib/analyticsService';

interface ContributionHeatmapProps {
  data: ContributionDay[];
}

export default function ContributionHeatmap({ data }: ContributionHeatmapProps) {
  // Group days by week
  const weeks = useMemo(() => {
    const weeksArray: ContributionDay[][] = [];
    let currentWeek: ContributionDay[] = [];

    // Start from the first Sunday
    const firstDay = new Date(data[0]?.date || new Date());
    const dayOfWeek = firstDay.getDay();
    
    // Add empty days to align to Sunday
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({
        date: '',
        count: 0,
        level: 0,
      });
    }

    data.forEach((day, index) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          level: 0,
        });
      }
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [data]);

  const totalContributions = data.reduce((sum, day) => sum + day.count, 0);
  const maxStreak = useMemo(() => {
    let currentStreak = 0;
    let maxStreak = 0;

    data.forEach(day => {
      if (day.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }, [data]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-2xl font-bold text-primary">{totalContributions}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Contributions</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{maxStreak}</p>
          <p className="text-xs text-muted-foreground mt-1">Longest Streak</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-2xl font-bold text-foreground">
            {data.filter(d => d.count > 0).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Active Days</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-1 mb-2 ml-8">
            {months.map((month, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground"
                style={{ width: `${100 / 12}%` }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {days.map((day, i) => (
                <div
                  key={i}
                  className="text-[10px] text-muted-foreground h-3 flex items-center"
                >
                  {i % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer group relative"
                    style={{
                      backgroundColor: day.date ? getContributionColor(day.level) : 'transparent',
                    }}
                    title={day.date ? `${day.date}: ${day.count} contributions` : ''}
                  >
                    {day.date && day.count > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-card/95 backdrop-blur-xl border border-white/20 rounded px-2 py-1 shadow-xl whitespace-nowrap text-xs">
                          <p className="text-foreground font-semibold">{day.count} contributions</p>
                          <p className="text-muted-foreground text-[10px]">{day.date}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getContributionColor(level as any) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
