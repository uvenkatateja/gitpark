/**
 * District Layout with Road Network
 * Integrates road network with parking lot layout
 * NO HARDCODED VALUES - All dynamically calculated
 */

import type { CarProps } from '@/types/car';
import type { PositionedCar } from '@/components/3d/InstancedCars';
import {
  generateRoadNetwork,
  calculateOptimalGrid,
  calculateRoadPath,
  calculateLotSize,
  type RoadNetwork,
  type LotPosition,
  type GridConfig,
} from './roadNetwork';
import { generateParkingZones, type ParkingZone } from './parkingZones';

// User Data
export interface UserData {
  username: string;
  avatarUrl: string;
  cars: CarProps[];
  fetchedAt: number;
  isClaimed?: boolean;
  rank?: number | null;
}

// User Section with Road Network
export interface UserSectionWithRoads {
  username: string;
  avatarUrl: string;
  cars: PositionedCar[];
  position: { x: number; z: number };
  entrance: { x: number; z: number };
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  lotPosition: LotPosition;
  zone?: ParkingZone;
  // Add compatibility properties
  isClaimed: boolean; // Make required
  rank?: number | null;
  sectionIndex: number; // Make required
  // Add for decorations and minimap compatibility
  center: [number, number, number];
  width: number;
  depth: number;
}

// District Layout with Roads
export interface DistrictLayoutWithRoads {
  sections: UserSectionWithRoads[];
  roadNetwork: RoadNetwork;
  zones: ParkingZone[];
  allCars: PositionedCar[]; // Add this for compatibility
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  center: { x: number; z: number };
}

// Parking Configuration
const PARKING_CONFIG = {
  cols: 6,
  spaceWidth: 2.2,
  spaceDepth: 3.8,
  rowGap: 0.8,
  padding: 3,
};

/**
 * Calculate car positions within a lot
 * Cars must stay INSIDE the lot boundaries
 */
function calculateCarPositions(
  cars: CarProps[],
  lotPosition: { x: number; z: number },
  lotWidth: number,
  lotDepth: number
): PositionedCar[] {
  const positioned: PositionedCar[] = [];
  const { cols, spaceWidth, spaceDepth, rowGap, padding } = PARKING_CONFIG;
  
  // Calculate how many cars we actually have
  const numCars = cars.length;
  const actualCols = Math.min(cols, numCars);
  const rows = Math.ceil(numCars / cols);
  
  // Calculate the total grid size
  const gridWidth = actualCols * spaceWidth;
  const gridDepth = rows * (spaceDepth + rowGap) - rowGap;
  
  // Calculate starting position (centered within lot, with padding)
  const startX = lotPosition.x + padding;
  const startZ = lotPosition.z + padding;
  
  // Center the grid horizontally within the lot
  const offsetX = (lotWidth - gridWidth - 2 * padding) / 2;
  
  cars.forEach((car, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Calculate actual columns in this row (last row might have fewer)
    const carsInRow = Math.min(cols, numCars - row * cols);
    const rowOffsetX = (actualCols - carsInRow) * spaceWidth / 2; // Center last row
    
    // Position within lot boundaries
    const slotX = startX + offsetX + col * spaceWidth + spaceWidth / 2 + rowOffsetX;
    const slotZ = startZ + row * (spaceDepth + rowGap) + spaceDepth / 2;
    
    // Rotation (slight variation for realism)
    const yRot = ((car.id % 97) / 97 - 0.5) * 0.18;
    
    positioned.push({
      ...car,
      slotX,
      slotZ,
      yRot,
    });
  });
  
  return positioned;
}

/**
 * Generate district layout with road network
 */
export function generateDistrictLayoutWithRoads(
  users: UserData[]
): DistrictLayoutWithRoads {
  // Calculate optimal grid configuration
  const gridConfig = calculateOptimalGrid(users.length);
  
  // Calculate individual lot sizes for each user based on their car count
  const lotSizes = users.map(user => calculateLotSize(user.cars.length));
  
  // Update grid config to use maximum lot sizes for grid spacing
  const maxWidth = Math.max(...lotSizes.map(s => s.width), gridConfig.lotWidth);
  const maxDepth = Math.max(...lotSizes.map(s => s.depth), gridConfig.lotDepth);
  
  const adjustedConfig = {
    ...gridConfig,
    lotWidth: maxWidth,
    lotDepth: maxDepth,
  };
  
  // Generate road network with adjusted config
  const roadNetwork = generateRoadNetwork(users.length, adjustedConfig);
  
  // Generate parking zones
  const allCars = users.flatMap(u => u.cars);
  const zones = generateParkingZones(allCars);
  
  // Create sections for each user with their specific lot size
  const sections: UserSectionWithRoads[] = users.map((user, index) => {
    const lotPosition = roadNetwork.lots[index];
    const { position, entrance } = lotPosition;
    const lotSize = lotSizes[index];
    
    // Calculate car positions with the actual lot size
    const positionedCars = calculateCarPositions(
      user.cars,
      position,
      lotSize.width,
      lotSize.depth
    );
    
    // Find zone for this user (based on primary language)
    const primaryLanguage = getMostUsedLanguage(user.cars);
    const zone = zones.find(z => z.language === primaryLanguage);
    
    // Calculate bounds using actual lot size
    const bounds = {
      minX: position.x,
      maxX: position.x + lotSize.width,
      minZ: position.z,
      maxZ: position.z + lotSize.depth,
    };
    
    // Calculate center using actual lot size
    const centerX = position.x + lotSize.width / 2;
    const centerZ = position.z + lotSize.depth / 2;
    
    return {
      username: user.username,
      avatarUrl: user.avatarUrl,
      cars: positionedCars,
      position,
      entrance,
      bounds,
      lotPosition,
      zone,
      isClaimed: user.isClaimed ?? false,
      rank: user.rank,
      sectionIndex: index,
      center: [centerX, 0, centerZ] as [number, number, number],
      width: lotSize.width,
      depth: lotSize.depth,
    };
  });
  
  // Get all cars for compatibility
  const allPositionedCars = sections.flatMap(s => s.cars);
  
  // Calculate overall bounds
  let bounds;
  if (roadNetwork.roads.length > 0) {
    bounds = {
      minX: Math.min(...roadNetwork.roads.map(r => Math.min(r.start.x, r.end.x))),
      maxX: Math.max(...roadNetwork.roads.map(r => Math.max(r.start.x, r.end.x))),
      minZ: Math.min(...roadNetwork.roads.map(r => Math.min(r.start.z, r.end.z))),
      maxZ: Math.max(...roadNetwork.roads.map(r => Math.max(r.start.z, r.end.z))),
    };
  } else {
    // Fallback for empty roads
    bounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  }
  
  // Calculate center
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2,
  };
  
  return {
    sections,
    roadNetwork,
    zones,
    allCars: allPositionedCars,
    bounds,
    center,
  };
}

/**
 * Get most used language from cars
 */
function getMostUsedLanguage(cars: CarProps[]): string {
  const languageCounts = new Map<string, number>();
  
  cars.forEach(car => {
    if (car.language) {
      languageCounts.set(car.language, (languageCounts.get(car.language) || 0) + 1);
    }
  });
  
  let maxCount = 0;
  let primaryLanguage = 'Unknown';
  
  languageCounts.forEach((count, language) => {
    if (count > maxCount) {
      maxCount = count;
      primaryLanguage = language;
    }
  });
  
  return primaryLanguage;
}

/**
 * Calculate path between two sections
 */
export function calculateSectionPath(
  from: UserSectionWithRoads,
  to: UserSectionWithRoads,
  roadNetwork: RoadNetwork
) {
  return calculateRoadPath(from.lotPosition, to.lotPosition, roadNetwork);
}

// Re-export road network utilities
export { calculateRoadPath } from './roadNetwork';
export type { RoadNetwork, Road, Intersection, LotPosition } from './roadNetwork';
