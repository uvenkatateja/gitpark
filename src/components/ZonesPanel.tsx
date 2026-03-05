/**
 * Zones Panel Component
 * Shows all parking zones with statistics
 */

import { useState } from 'react';
import { MapPin, TrendingUp, Package, Star, X } from 'lucide-react';
import type { ParkingZone } from '@/lib/parkingZones';
import { calculateZoneStats, sortZones } from '@/lib/parkingZones';

interface ZonesPanelProps {
  zones: ParkingZone[];
  onZoneClick?: (zone: ParkingZone) => void;
  onClose?: () => void;
}

export default function ZonesPanel({ zones, onZoneClick, onClose }: ZonesPanelProps) {
  const [sortBy, setSortBy] = useState<'repos' | 'stars' | 'name'>('repos');
  
  const sortedZones = sortZones(zones, sortBy);

  return (
    <div className="absolute top-6 left-6 z-30 w-80 max-h-[80vh] overflow-y-auto pointer-events-auto bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl scrollbar-hide">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Parking Zones
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Sort buttons */}
        <div className="flex gap-1 mt-2">
          {[
            { id: 'repos' as const, label: 'Repos', icon: Package },
            { id: 'stars' as const, label: 'Stars', icon: Star },
            { id: 'name' as const, label: 'Name', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSortBy(id)}
              className={`
                flex-1 px-2 py-1 rounded text-[10px] font-pixel uppercase tracking-wider
                transition-all flex items-center justify-center gap-1
                ${sortBy === id
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                }
              `}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Zones list */}
      <div className="divide-y divide-white/5">
        {sortedZones.map((zone, index) => {
          const stats = calculateZoneStats(zone.repos);
          
          return (
            <button
              key={zone.id}
              onClick={() => onZoneClick?.(zone)}
              className="w-full px-4 py-3 hover:bg-white/5 transition-all group text-left"
            >
              {/* Zone header */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: `${zone.color}20`,
                    color: zone.color,
                    border: `1px solid ${zone.color}40`,
                  }}
                >
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-pixel text-xs text-foreground truncate group-hover:text-primary transition-colors">
                    {zone.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {zone.language}
                  </p>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded px-2 py-1">
                  <p className="text-xs font-bold text-foreground">{stats.totalRepos}</p>
                  <p className="text-[9px] text-muted-foreground">Repos</p>
                </div>
                <div className="bg-white/5 rounded px-2 py-1">
                  <p className="text-xs font-bold text-yellow-400">{stats.totalStars}</p>
                  <p className="text-[9px] text-muted-foreground">Stars</p>
                </div>
                <div className="bg-white/5 rounded px-2 py-1">
                  <p className="text-xs font-bold text-blue-400">{stats.avgStars}</p>
                  <p className="text-[9px] text-muted-foreground">Avg</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {zones.length === 0 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No zones available</p>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
