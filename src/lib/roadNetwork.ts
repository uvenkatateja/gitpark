/**
 * Road Network System
 * Creates a proper grid layout with roads connecting all parking lots
 * NO HARDCODED VALUES - All dynamically calculated
 */

import type { Vector3 } from 'three';

// Grid Configuration
export interface GridConfig {
  lotsPerRow: number;
  lotWidth: number;
  lotDepth: number;
  roadWidth: number;
  spacing: number;
}

// Road Types
export type RoadType = 'highway' | 'street' | 'entrance';

// Road Configuration
export interface Road {
  id: string;
  type: RoadType;
  start: { x: number; z: number };
  end: { x: number; z: number };
  width: number;
  lanes: number;
  markings: RoadMarking[];
}

// Road Marking
export interface RoadMarking {
  type: 'center' | 'lane' | 'edge';
  color: string;
  dashed: boolean;
  offset: number;
}

// Intersection
export interface Intersection {
  id: string;
  position: { x: number; z: number };
  size: number;
  roads: string[]; // Connected road IDs
}

// Parking Lot Position
export interface LotPosition {
  index: number;
  position: { x: number; z: number };
  entrance: { x: number; z: number };
  row: number;
  col: number;
}

// Road Network
export interface RoadNetwork {
  config: GridConfig;
  lots: LotPosition[];
  roads: Road[];
  intersections: Intersection[];
}

// Default Grid Configuration
export const DEFAULT_GRID_CONFIG: GridConfig = {
  lotsPerRow: 4,
  lotWidth: 50,
  lotDepth: 40,
  roadWidth: 12,
  spacing: 2,
};

/**
 * Calculate dynamic lot size based on number of cars
 */
export function calculateLotSize(carCount: number): { width: number; depth: number } {
  const PARKING_CONFIG = {
    cols: 6,
    spaceWidth: 2.2,
    spaceDepth: 3.8,
    rowGap: 0.8,
    padding: 3,
  };
  
  const cols = Math.min(PARKING_CONFIG.cols, Math.max(1, carCount));
  const rows = Math.ceil(carCount / cols);
  
  // Calculate dimensions based on actual car layout
  const width = cols * PARKING_CONFIG.spaceWidth + PARKING_CONFIG.padding * 2;
  const depth = rows * (PARKING_CONFIG.spaceDepth + PARKING_CONFIG.rowGap) - PARKING_CONFIG.rowGap + PARKING_CONFIG.padding * 2;
  
  // Add minimum size and some extra space
  return {
    width: Math.max(width, 20),
    depth: Math.max(depth, 20),
  };
}

/**
 * Calculate lot position in grid
 */
export function calculateLotPosition(
  index: number,
  config: GridConfig = DEFAULT_GRID_CONFIG,
  lotSize?: { width: number; depth: number }
): LotPosition {
  const row = Math.floor(index / config.lotsPerRow);
  const col = index % config.lotsPerRow;
  
  // Use custom lot size if provided, otherwise use config default
  const width = lotSize?.width ?? config.lotWidth;
  const depth = lotSize?.depth ?? config.lotDepth;
  
  const cellWidth = config.lotWidth + config.roadWidth + config.spacing;
  const cellDepth = config.lotDepth + config.roadWidth + config.spacing;
  
  const x = col * cellWidth;
  const z = row * cellDepth;
  
  // Entrance is at the front (bottom) of the lot
  const entrance = {
    x: x + width / 2,
    z: z + depth,
  };
  
  return {
    index,
    position: { x, z },
    entrance,
    row,
    col,
  };
}

/**
 * Generate road network for given number of lots
 */
export function generateRoadNetwork(
  lotCount: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): RoadNetwork {
  const lots: LotPosition[] = [];
  const roads: Road[] = [];
  const intersections: Intersection[] = [];
  
  // Safety check: if no lots, return empty network
  if (lotCount === 0) {
    return {
      config,
      lots: [],
      roads: [],
      intersections: [],
    };
  }
  
  // Calculate all lot positions
  for (let i = 0; i < lotCount; i++) {
    lots.push(calculateLotPosition(i, config));
  }
  
  const rows = Math.ceil(lotCount / config.lotsPerRow);
  const cols = Math.min(lotCount, config.lotsPerRow);
  
  // Generate horizontal roads (streets between rows)
  for (let row = 0; row <= rows; row++) {
    const z = row * (config.lotDepth + config.roadWidth + config.spacing) + config.lotDepth;
    const roadId = `horizontal-${row}`;
    
    roads.push({
      id: roadId,
      type: row === rows ? 'highway' : 'street',
      start: { x: -config.roadWidth, z },
      end: { x: cols * (config.lotWidth + config.roadWidth + config.spacing), z },
      width: config.roadWidth,
      lanes: 2,
      markings: generateRoadMarkings(config.roadWidth, 'horizontal'),
    });
  }
  
  // Generate vertical roads (streets between columns)
  for (let col = 0; col <= cols; col++) {
    const x = col * (config.lotWidth + config.roadWidth + config.spacing) - config.roadWidth / 2;
    const roadId = `vertical-${col}`;
    
    roads.push({
      id: roadId,
      type: 'street',
      start: { x, z: -config.roadWidth },
      end: { x, z: rows * (config.lotDepth + config.roadWidth + config.spacing) + config.lotDepth + config.roadWidth },
      width: config.roadWidth,
      lanes: 2,
      markings: generateRoadMarkings(config.roadWidth, 'vertical'),
    });
  }
  
  // Generate intersections
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const x = col * (config.lotWidth + config.roadWidth + config.spacing) - config.roadWidth / 2;
      const z = row * (config.lotDepth + config.roadWidth + config.spacing) + config.lotDepth;
      
      intersections.push({
        id: `intersection-${row}-${col}`,
        position: { x, z },
        size: config.roadWidth,
        roads: [
          `horizontal-${row}`,
          `vertical-${col}`,
        ],
      });
    }
  }
  
  return {
    config,
    lots,
    roads,
    intersections,
  };
}

/**
 * Generate road markings
 */
function generateRoadMarkings(
  roadWidth: number,
  direction: 'horizontal' | 'vertical'
): RoadMarking[] {
  const markings: RoadMarking[] = [];
  
  // Center line (yellow, dashed)
  markings.push({
    type: 'center',
    color: '#FFD700',
    dashed: true,
    offset: 0,
  });
  
  // Lane lines (white, dashed)
  markings.push({
    type: 'lane',
    color: '#FFFFFF',
    dashed: true,
    offset: roadWidth / 4,
  });
  
  markings.push({
    type: 'lane',
    color: '#FFFFFF',
    dashed: true,
    offset: -roadWidth / 4,
  });
  
  // Edge lines (white, solid)
  markings.push({
    type: 'edge',
    color: '#FFFFFF',
    dashed: false,
    offset: roadWidth / 2,
  });
  
  markings.push({
    type: 'edge',
    color: '#FFFFFF',
    dashed: false,
    offset: -roadWidth / 2,
  });
  
  return markings;
}

/**
 * Calculate path between two lots using roads
 */
export function calculateRoadPath(
  fromLot: LotPosition,
  toLot: LotPosition,
  network: RoadNetwork
): Vector3[] {
  const path: Vector3[] = [];
  
  // Start at entrance of from lot
  path.push({
    x: fromLot.entrance.x,
    y: 0,
    z: fromLot.entrance.z,
  } as Vector3);
  
  // Move to road
  const fromRoadZ = fromLot.entrance.z + network.config.roadWidth / 2;
  path.push({
    x: fromLot.entrance.x,
    y: 0,
    z: fromRoadZ,
  } as Vector3);
  
  // Navigate to destination column
  if (fromLot.col !== toLot.col) {
    // Move horizontally along current row's road
    const targetX = toLot.entrance.x;
    path.push({
      x: targetX,
      y: 0,
      z: fromRoadZ,
    } as Vector3);
  }
  
  // Navigate to destination row
  if (fromLot.row !== toLot.row) {
    const toRoadZ = toLot.entrance.z + network.config.roadWidth / 2;
    path.push({
      x: toLot.entrance.x,
      y: 0,
      z: toRoadZ,
    } as Vector3);
  }
  
  // Move to entrance of to lot
  path.push({
    x: toLot.entrance.x,
    y: 0,
    z: toLot.entrance.z,
  } as Vector3);
  
  return path;
}

/**
 * Get road material configuration
 */
export function getRoadMaterial(type: RoadType) {
  const materials = {
    highway: {
      color: '#1a1a1a',
      roughness: 0.9,
      metalness: 0.1,
    },
    street: {
      color: '#2a2a2a',
      roughness: 0.85,
      metalness: 0.05,
    },
    entrance: {
      color: '#3a3a3a',
      roughness: 0.8,
      metalness: 0,
    },
  };
  
  return materials[type];
}

/**
 * Calculate optimal grid configuration based on lot count
 */
export function calculateOptimalGrid(lotCount: number): GridConfig {
  // Aim for roughly square layout
  const lotsPerRow = Math.ceil(Math.sqrt(lotCount));
  
  return {
    ...DEFAULT_GRID_CONFIG,
    lotsPerRow,
  };
}

/**
 * Get center position of entire network
 */
export function getNetworkCenter(network: RoadNetwork): { x: number; z: number } {
  if (network.lots.length === 0) {
    return { x: 0, z: 0 };
  }
  
  const lastLot = network.lots[network.lots.length - 1];
  const totalWidth = lastLot.position.x + network.config.lotWidth;
  const totalDepth = lastLot.position.z + network.config.lotDepth;
  
  return {
    x: totalWidth / 2,
    z: totalDepth / 2,
  };
}

/**
 * Get bounds of entire network
 */
export function getNetworkBounds(network: RoadNetwork) {
  if (network.lots.length === 0) {
    return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  }
  
  const lastLot = network.lots[network.lots.length - 1];
  
  return {
    minX: -network.config.roadWidth,
    maxX: lastLot.position.x + network.config.lotWidth + network.config.roadWidth,
    minZ: -network.config.roadWidth,
    maxZ: lastLot.position.z + network.config.lotDepth + network.config.roadWidth * 2,
  };
}
