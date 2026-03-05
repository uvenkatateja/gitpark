/**
 * Star Growth Chart
 * Line chart showing star accumulation over time
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { StarGrowth } from '@/lib/analyticsService';
import { formatDate, formatNumber } from '@/lib/analyticsService';

interface StarGrowthChartProps {
  data: StarGrowth[];
  detailed?: boolean;
}

export default function StarGrowthChart({ data, detailed = false }: StarGrowthChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">No growth data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-muted-foreground">{formatDate(data.date)}</p>
          <p className="text-sm font-semibold text-foreground mt-1">
            ⭐ {formatNumber(data.stars)} stars
          </p>
          <p className="text-xs text-muted-foreground">
            {data.repos} repositories
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={detailed ? 400 : 200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="starGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatNumber}
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="stars"
            stroke="#FFD700"
            strokeWidth={2}
            fill="url(#starGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-primary">
            {formatNumber(data[data.length - 1]?.stars || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total Stars</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {data[data.length - 1]?.repos || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Repositories</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-400">
            {data.length > 1 ? '+' + formatNumber(data[data.length - 1].stars - data[0].stars) : '0'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Growth</p>
        </div>
      </div>
    </div>
  );
}
