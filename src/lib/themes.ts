/**
 * Theme System for Repo-Ridez
 * Defines visual themes for the parking district
 */

export interface ParkingTheme {
  id: string;
  name: string;
  description: string;
  sky: {
    gradient: Array<[number, string]>; // [stop, color]
    topColor: string;
    bottomColor: string;
  };
  fog: {
    color: string;
    near: number;
    far: number;
  };
  lighting: {
    ambient: {
      color: string;
      intensity: number;
    };
    directional: {
      color: string;
      intensity: number;
      position: [number, number, number];
    };
    hemisphere: {
      skyColor: string;
      groundColor: string;
      intensity: number;
    };
  };
  ground: {
    baseColor: string;
    emissive: string;
    emissiveIntensity: number;
    gridColor1: string;
    gridColor2: string;
  };
  section: {
    asphaltColor: string;
    asphaltEmissive: string;
    borderColor: string;
    borderEmissive: string;
  };
  ui: {
    accentColor: string;
    textColor: string;
    labelBackground: string;
  };
  wall: {
    brickColor: string;
    foundationColor: string;
  };
}

export const PARKING_THEMES: Record<string, ParkingTheme> = {
  night: {
    id: 'night',
    name: 'Midnight',
    description: 'Dark, moody atmosphere with cool blue tones',
    sky: {
      gradient: [
        [0, '#000206'],
        [0.15, '#020814'],
        [0.30, '#061428'],
        [0.45, '#0c2040'],
        [0.55, '#102850'],
        [0.65, '#0c2040'],
        [0.80, '#061020'],
        [1, '#020608'],
      ],
      topColor: '#0c2040',
      bottomColor: '#000206',
    },
    fog: {
      color: '#0a1428',
      near: 35,
      far: 150,
    },
    lighting: {
      ambient: {
        color: '#4060b0',
        intensity: 0.15,
      },
      directional: {
        color: '#7090d0',
        intensity: 0.3,
        position: [20, 40, 15],
      },
      hemisphere: {
        skyColor: '#1a1a3e',
        groundColor: '#050510',
        intensity: 0.25,
      },
    },
    ground: {
      baseColor: '#050508',
      emissive: '#050508',
      emissiveIntensity: 0.1,
      gridColor1: '#0e0e20',
      gridColor2: '#0a0a18',
    },
    section: {
      asphaltColor: '#0c0c18',
      asphaltEmissive: '#0c0c18',
      borderColor: '#12122a',
      borderEmissive: '#1a1a40',
    },
    ui: {
      accentColor: '#6090e0',
      textColor: '#ffd700',
      labelBackground: 'rgba(10, 10, 20, 0.75)',
    },
    wall: {
      brickColor: '#2a3a50',
      foundationColor: '#1a1a28',
    },
  },

  day: {
    id: 'day',
    name: 'Daylight',
    description: 'Bright, clear daytime atmosphere',
    sky: {
      gradient: [
        [0, '#87CEEB'],
        [0.3, '#B0E0E6'],
        [0.5, '#E0F6FF'],
        [0.7, '#B0E0E6'],
        [1, '#87CEEB'],
      ],
      topColor: '#87CEEB',
      bottomColor: '#E0F6FF',
    },
    fog: {
      color: '#c0d8e8',
      near: 50,
      far: 200,
    },
    lighting: {
      ambient: {
        color: '#ffffff',
        intensity: 0.6,
      },
      directional: {
        color: '#fffacd',
        intensity: 1.0,
        position: [50, 100, 30],
      },
      hemisphere: {
        skyColor: '#87CEEB',
        groundColor: '#8B7355',
        intensity: 0.5,
      },
    },
    ground: {
      baseColor: '#2a2a2a',
      emissive: '#1a1a1a',
      emissiveIntensity: 0.05,
      gridColor1: '#3a3a3a',
      gridColor2: '#323232',
    },
    section: {
      asphaltColor: '#1a1a1a',
      asphaltEmissive: '#0a0a0a',
      borderColor: '#2a2a2a',
      borderEmissive: '#1a1a1a',
    },
    ui: {
      accentColor: '#4a90e2',
      textColor: '#2c3e50',
      labelBackground: 'rgba(255, 255, 255, 0.85)',
    },
    wall: {
      brickColor: '#8B4513',
      foundationColor: '#5a5a5a',
    },
  },

  sunset: {
    id: 'sunset',
    name: 'Golden Hour',
    description: 'Warm sunset with orange and purple hues',
    sky: {
      gradient: [
        [0, '#0c0614'],
        [0.15, '#1c0e30'],
        [0.28, '#3a1850'],
        [0.38, '#6a3060'],
        [0.46, '#a05068'],
        [0.52, '#d07060'],
        [0.57, '#e89060'],
        [0.62, '#f0b070'],
        [0.68, '#f0c888'],
        [0.75, '#c08060'],
        [0.85, '#603030'],
        [1, '#180c10'],
      ],
      topColor: '#6a3060',
      bottomColor: '#f0b070',
    },
    fog: {
      color: '#80405a',
      near: 40,
      far: 160,
    },
    lighting: {
      ambient: {
        color: '#e0a080',
        intensity: 0.4,
      },
      directional: {
        color: '#f0b070',
        intensity: 0.8,
        position: [40, 30, -30],
      },
      hemisphere: {
        skyColor: '#d09080',
        groundColor: '#4a2828',
        intensity: 0.55,
      },
    },
    ground: {
      baseColor: '#1a1418',
      emissive: '#1a1418',
      emissiveIntensity: 0.12,
      gridColor1: '#2a2028',
      gridColor2: '#221c20',
    },
    section: {
      asphaltColor: '#181018',
      asphaltEmissive: '#181018',
      borderColor: '#281828',
      borderEmissive: '#382838',
    },
    ui: {
      accentColor: '#f0b070',
      textColor: '#ffd700',
      labelBackground: 'rgba(26, 20, 24, 0.8)',
    },
    wall: {
      brickColor: '#8a5a4a',
      foundationColor: '#3a2a28',
    },
  },

  neon: {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Cyberpunk vibes with electric colors',
    sky: {
      gradient: [
        [0, '#06001a'],
        [0.15, '#100028'],
        [0.30, '#200440'],
        [0.42, '#380650'],
        [0.52, '#500860'],
        [0.60, '#380648'],
        [0.75, '#180230'],
        [0.90, '#0c0118'],
        [1, '#06000c'],
      ],
      topColor: '#500860',
      bottomColor: '#06001a',
    },
    fog: {
      color: '#1a0830',
      near: 35,
      far: 140,
    },
    lighting: {
      ambient: {
        color: '#8040c0',
        intensity: 0.3,
      },
      directional: {
        color: '#c050e0',
        intensity: 0.6,
        position: [30, 40, -20],
      },
      hemisphere: {
        skyColor: '#9040d0',
        groundColor: '#201028',
        intensity: 0.5,
      },
    },
    ground: {
      baseColor: '#0a0814',
      emissive: '#0a0814',
      emissiveIntensity: 0.15,
      gridColor1: '#1a1428',
      gridColor2: '#121020',
    },
    section: {
      asphaltColor: '#0c0818',
      asphaltEmissive: '#0c0818',
      borderColor: '#1c1838',
      borderEmissive: '#2c2848',
    },
    ui: {
      accentColor: '#e040c0',
      textColor: '#ff40ff',
      labelBackground: 'rgba(10, 8, 20, 0.8)',
    },
    wall: {
      brickColor: '#4a2860',
      foundationColor: '#1a0828',
    },
  },
};

export const DEFAULT_THEME_ID = 'night';

export function getTheme(themeId: string): ParkingTheme {
  return PARKING_THEMES[themeId] || PARKING_THEMES[DEFAULT_THEME_ID];
}

export function getAllThemes(): ParkingTheme[] {
  return Object.values(PARKING_THEMES);
}

export function getThemeIds(): string[] {
  return Object.keys(PARKING_THEMES);
}
