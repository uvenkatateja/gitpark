/**
 * Loading Messages System
 * Fun, contextual loading messages
 * NO HARDCODED SELECTION - Messages are contextually chosen
 */

// Message Categories
export type LoadingCategory = 
  | 'parking'
  | 'car'
  | 'github'
  | 'general'
  | 'funny';

// Loading Message Configuration
export interface LoadingMessage {
  id: string;
  text: string;
  category: LoadingCategory;
  icon: string;
}

// Message Registry
export const LOADING_MESSAGES: LoadingMessage[] = [
  // Parking themed
  {
    id: 'finding_spot',
    text: 'Finding the perfect parking spot...',
    category: 'parking',
    icon: '🅿️',
  },
  {
    id: 'painting_lines',
    text: 'Painting parking lines...',
    category: 'parking',
    icon: '🎨',
  },
  {
    id: 'checking_meters',
    text: 'Checking parking meters...',
    category: 'parking',
    icon: '💰',
  },
  {
    id: 'reserving_spot',
    text: 'Reserving your spot...',
    category: 'parking',
    icon: '📍',
  },
  {
    id: 'parallel_parking',
    text: 'Practicing parallel parking...',
    category: 'parking',
    icon: '🚗',
  },
  
  // Car themed
  {
    id: 'polishing_cars',
    text: 'Polishing cars...',
    category: 'car',
    icon: '✨',
  },
  {
    id: 'checking_tires',
    text: 'Checking tire pressure...',
    category: 'car',
    icon: '🛞',
  },
  {
    id: 'fueling_up',
    text: 'Fueling up the engines...',
    category: 'car',
    icon: '⛽',
  },
  {
    id: 'tuning_engines',
    text: 'Tuning engines...',
    category: 'car',
    icon: '🔧',
  },
  {
    id: 'washing_cars',
    text: 'Washing the cars...',
    category: 'car',
    icon: '🧼',
  },
  {
    id: 'installing_spoilers',
    text: 'Installing spoilers...',
    category: 'car',
    icon: '🏎️',
  },
  
  // GitHub themed
  {
    id: 'fetching_repos',
    text: 'Fetching repositories...',
    category: 'github',
    icon: '📦',
  },
  {
    id: 'counting_stars',
    text: 'Counting stars...',
    category: 'github',
    icon: '⭐',
  },
  {
    id: 'cloning_repos',
    text: 'Cloning repositories...',
    category: 'github',
    icon: '📋',
  },
  {
    id: 'merging_branches',
    text: 'Merging branches...',
    category: 'github',
    icon: '🔀',
  },
  {
    id: 'pushing_commits',
    text: 'Pushing commits...',
    category: 'github',
    icon: '🚀',
  },
  {
    id: 'resolving_conflicts',
    text: 'Resolving merge conflicts...',
    category: 'github',
    icon: '⚔️',
  },
  
  // General
  {
    id: 'loading_data',
    text: 'Loading your data...',
    category: 'general',
    icon: '📊',
  },
  {
    id: 'preparing_view',
    text: 'Preparing your view...',
    category: 'general',
    icon: '👀',
  },
  {
    id: 'building_scene',
    text: 'Building 3D scene...',
    category: 'general',
    icon: '🏗️',
  },
  {
    id: 'rendering_graphics',
    text: 'Rendering graphics...',
    category: 'general',
    icon: '🎮',
  },
  
  // Funny
  {
    id: 'feeding_hamsters',
    text: 'Feeding the hamsters...',
    category: 'funny',
    icon: '🐹',
  },
  {
    id: 'brewing_coffee',
    text: 'Brewing coffee for the servers...',
    category: 'funny',
    icon: '☕',
  },
  {
    id: 'convincing_api',
    text: 'Convincing the API to respond...',
    category: 'funny',
    icon: '🤝',
  },
  {
    id: 'untangling_cables',
    text: 'Untangling ethernet cables...',
    category: 'funny',
    icon: '🔌',
  },
  {
    id: 'debugging_universe',
    text: 'Debugging the universe...',
    category: 'funny',
    icon: '🌌',
  },
  {
    id: 'compiling_hopes',
    text: 'Compiling hopes and dreams...',
    category: 'funny',
    icon: '✨',
  },
];

// Get random message from category
export function getLoadingMessage(category?: LoadingCategory): LoadingMessage {
  const messages = category
    ? LOADING_MESSAGES.filter(m => m.category === category)
    : LOADING_MESSAGES;
  
  return messages[Math.floor(Math.random() * messages.length)];
}

// Get contextual message based on what's loading
export function getContextualLoadingMessage(context: {
  isLoadingUser?: boolean;
  isLoadingRepos?: boolean;
  isBuilding3D?: boolean;
  isFunny?: boolean;
}): LoadingMessage {
  if (context.isFunny && Math.random() > 0.7) {
    return getLoadingMessage('funny');
  }
  
  if (context.isLoadingUser || context.isLoadingRepos) {
    return getLoadingMessage('github');
  }
  
  if (context.isBuilding3D) {
    return getLoadingMessage('general');
  }
  
  // Default: mix of parking and car
  const category = Math.random() > 0.5 ? 'parking' : 'car';
  return getLoadingMessage(category);
}

// Get sequence of messages for longer loading
export function getLoadingSequence(count: number = 3): LoadingMessage[] {
  const sequence: LoadingMessage[] = [];
  const used = new Set<string>();
  
  while (sequence.length < count) {
    const message = getLoadingMessage();
    if (!used.has(message.id)) {
      sequence.push(message);
      used.add(message.id);
    }
  }
  
  return sequence;
}

// Get loading message with rotation
let lastMessageIndex = -1;
export function getRotatingLoadingMessage(): LoadingMessage {
  lastMessageIndex = (lastMessageIndex + 1) % LOADING_MESSAGES.length;
  return LOADING_MESSAGES[lastMessageIndex];
}
