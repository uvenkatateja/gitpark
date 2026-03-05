/**
 * Parking Zones System
 * Dynamic zone generation based on repository languages
 */

import { LANGUAGE_COLORS } from './analyticsService';

export interface ParkingZone {
  id: string;
  name: string;
  language: string;
  color: string;
  groundColor: string;
  borderColor: string;
  emissiveColor: string;
  repos: any[];
  center: [number, number, number];
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export interface ZoneStats {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  avgStars: number;
}

/**
 * Zone name templates for variety
 */
const ZONE_NAME_TEMPLATES = [
  '{language} Junction',
  '{language} Plaza',
  '{language} Terminal',
  '{language} District',
  '{language} Quarter',
  '{language} Avenue',
  '{language} Boulevard',
  '{language} Park',
  '{language} Square',
  '{language} Hub',
];

/**
 * Get zone name for a language
 */
function getZoneName(language: string, index: number): string {
  const template = ZONE_NAME_TEMPLATES[index % ZONE_NAME_TEMPLATES.length];
  return template.replace('{language}', language);
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  const newR = Math.min(255, Math.max(0, Math.floor(r * (1 + percent))));
  const newG = Math.min(255, Math.max(0, Math.floor(g * (1 + percent))));
  const newB = Math.min(255, Math.max(0, Math.floor(b * (1 + percent))));
  
  // Convert back to hex
  return '#' + [newR, newG, newB]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate zone colors from language color
 */
function generateZoneColors(languageColor: string) {
  return {
    color: languageColor,
    groundColor: adjustColorBrightness(languageColor, -0.7), // Darker for ground
    borderColor: adjustColorBrightness(languageColor, -0.3), // Medium for border
    emissiveColor: adjustColorBrightness(languageColor, 0.2), // Brighter for emissive
  };
}

/**
 * Group repositories by language
 */
export function groupReposByLanguage(repos: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>();
  
  repos.forEach(repo => {
    const language = repo.language || 'Other';
    if (!grouped.has(language)) {
      grouped.set(language, []);
    }
    grouped.get(language)!.push(repo);
  });
  
  return grouped;
}

/**
 * Calculate zone statistics
 */
export function calculateZoneStats(repos: any[]): ZoneStats {
  const totalRepos = repos.length;
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stars || 0), 0);
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks || 0), 0);
  const avgStars = totalRepos > 0 ? Math.round(totalStars / totalRepos) : 0;
  
  return {
    totalRepos,
    totalStars,
    totalForks,
    avgStars,
  };
}

/**
 * Generate parking zones from repositories
 */
export function generateParkingZones(
  repos: any[],
  sectionsPerZone: number = 6
): ParkingZone[] {
  // Group repos by language
  const languageGroups = groupReposByLanguage(repos);
  
  // Sort by repo count (descending)
  const sortedLanguages = Array.from(languageGroups.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  const zones: ParkingZone[] = [];
  let zoneIndex = 0;
  
  sortedLanguages.forEach(([language, languageRepos], index) => {
    const baseColor = LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other;
    const colors = generateZoneColors(baseColor);
    
    // Calculate zone position (spiral layout)
    const angle = (zoneIndex * Math.PI * 2) / Math.max(sortedLanguages.length, 6);
    const radius = 100 + (Math.floor(zoneIndex / 6) * 80);
    const centerX = Math.cos(angle) * radius;
    const centerZ = Math.sin(angle) * radius;
    
    // Calculate zone bounds based on repo count
    const zoneSize = Math.max(40, Math.min(80, languageRepos.length * 8));
    
    zones.push({
      id: `zone-${language.toLowerCase().replace(/\s+/g, '-')}`,
      name: getZoneName(language, index),
      language,
      color: colors.color,
      groundColor: colors.groundColor,
      borderColor: colors.borderColor,
      emissiveColor: colors.emissiveColor,
      repos: languageRepos,
      center: [centerX, 0, centerZ],
      bounds: {
        minX: centerX - zoneSize / 2,
        maxX: centerX + zoneSize / 2,
        minZ: centerZ - zoneSize / 2,
        maxZ: centerZ + zoneSize / 2,
      },
    });
    
    zoneIndex++;
  });
  
  return zones;
}

/**
 * Find which zone a position belongs to
 */
export function findZoneAtPosition(
  zones: ParkingZone[],
  x: number,
  z: number
): ParkingZone | null {
  for (const zone of zones) {
    if (
      x >= zone.bounds.minX &&
      x <= zone.bounds.maxX &&
      z >= zone.bounds.minZ &&
      z <= zone.bounds.maxZ
    ) {
      return zone;
    }
  }
  return null;
}

/**
 * Get zone by language
 */
export function getZoneByLanguage(
  zones: ParkingZone[],
  language: string
): ParkingZone | null {
  return zones.find(zone => zone.language === language) || null;
}

/**
 * Sort zones by various criteria
 */
export function sortZones(
  zones: ParkingZone[],
  sortBy: 'repos' | 'stars' | 'name' = 'repos'
): ParkingZone[] {
  return [...zones].sort((a, b) => {
    switch (sortBy) {
      case 'repos':
        return b.repos.length - a.repos.length;
      case 'stars':
        const aStars = a.repos.reduce((sum, r) => sum + (r.stars || 0), 0);
        const bStars = b.repos.reduce((sum, r) => sum + (r.stars || 0), 0);
        return bStars - aStars;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

/**
 * Get zone color with opacity
 */
export function getZoneColorWithOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate zone gradient
 */
export function generateZoneGradient(zone: ParkingZone): string {
  return `linear-gradient(135deg, ${zone.groundColor} 0%, ${adjustColorBrightness(zone.groundColor, -0.2)} 100%)`;
}
