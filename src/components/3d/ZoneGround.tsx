/**
 * Zone Ground Component  
 * Renders subtle zone markers without colored overlays
 */

import type { ParkingZone } from '@/lib/parkingZones';

interface ZoneGroundProps {
  zone: ParkingZone;
  theme: any;
}

export default function ZoneGround({ zone, theme }: ZoneGroundProps) {
  // Zones are now invisible - only used for logical grouping
  // The grass ground from DistrictScene is the only visible ground
  return null;
}
