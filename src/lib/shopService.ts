/**
 * Shop Service
 * Handles shop items, purchases, and coin management
 */

export type ShopCategory = 'color' | 'decal' | 'decoration' | 'effect' | 'boost' | 'special';
export type ShopRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type TransactionType = 'daily_claim' | 'achievement' | 'streak_bonus' | 'purchase' | 'gift_sent' | 'gift_received' | 'admin' | 'refund';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopCategory;
  icon: string;
  value?: string;
  rarity: ShopRarity;
  isLimited: boolean;
  limitedStock?: number;
  isActive: boolean;
  minLevel?: number;
  requiredAchievement?: string;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  purchasedAt: string;
  item?: ShopItem;
}

export interface CoinTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  transactionType: TransactionType;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export interface PurchaseResult {
  success: boolean;
  newBalance?: number;
  errorMessage?: string;
}

export interface DailyClaimResult {
  success: boolean;
  coinsAwarded: number;
  newBalance: number;
  nextClaimDate: string;
}

/**
 * Fetch all shop items
 */
export async function fetchShopItems(): Promise<ShopItem[]> {
  const response = await fetch('/api/shop/items');
  if (!response.ok) throw new Error('Failed to fetch shop items');
  const data = await response.json();
  return data.items || [];
}

/**
 * Fetch user's inventory
 */
export async function fetchInventory(parkerId: number): Promise<InventoryItem[]> {
  const response = await fetch(`/api/shop/inventory?parkerId=${parkerId}`);
  if (!response.ok) throw new Error('Failed to fetch inventory');
  const data = await response.json();
  return data.inventory || [];
}

/**
 * Purchase an item
 */
export async function purchaseItem(parkerId: number, itemId: string, quantity: number = 1): Promise<PurchaseResult> {
  const response = await fetch('/api/shop/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parkerId, itemId, quantity }),
  });
  
  const data = await response.json();
  return data;
}

/**
 * Claim daily free coins
 */
export async function claimDailyCoins(parkerId: number): Promise<DailyClaimResult> {
  const response = await fetch('/api/shop/daily-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parkerId }),
  });
  
  if (!response.ok) throw new Error('Failed to claim daily coins');
  const data = await response.json();
  return data;
}

/**
 * Gift coins to another user
 */
export async function giftCoins(senderId: number, receiverId: number, amount: number): Promise<PurchaseResult> {
  const response = await fetch('/api/shop/gift', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, receiverId, amount }),
  });
  
  const data = await response.json();
  return data;
}

/**
 * Fetch coin transaction history
 */
export async function fetchTransactionHistory(parkerId: number, limit: number = 50): Promise<CoinTransaction[]> {
  const response = await fetch(`/api/shop/transactions?parkerId=${parkerId}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch transactions');
  const data = await response.json();
  return data.transactions || [];
}

/**
 * Check if user can claim daily coins
 */
export function canClaimDaily(lastClaimDate: string | null): boolean {
  if (!lastClaimDate) return true;
  const lastClaim = new Date(lastClaimDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastClaim.setHours(0, 0, 0, 0);
  return lastClaim < today;
}

/**
 * Calculate daily coin reward with streak bonus
 */
export function calculateDailyReward(currentStreak: number): { base: number; bonus: number; total: number } {
  const base = 50;
  const bonus = Math.min(currentStreak * 5, 100);
  return { base, bonus, total: base + bonus };
}

/**
 * Format coin amount with commas
 */
export function formatCoins(amount: number): string {
  return amount.toLocaleString();
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: ShopCategory): string {
  const icons: Record<ShopCategory, string> = {
    color: '🎨',
    decal: '⭐',
    decoration: '🏛️',
    effect: '✨',
    boost: '⚡',
    special: '🎁',
  };
  return icons[category];
}

/**
 * Get category label
 */
export function getCategoryLabel(category: ShopCategory): string {
  const labels: Record<ShopCategory, string> = {
    color: 'Colors',
    decal: 'Decals',
    decoration: 'Decorations',
    effect: 'Effects',
    boost: 'Boosts',
    special: 'Special',
  };
  return labels[category];
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: ShopRarity): string {
  const colors: Record<ShopRarity, string> = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#F59E0B',
  };
  return colors[rarity];
}

/**
 * Sort items by category and price
 */
export function sortShopItems(items: ShopItem[]): ShopItem[] {
  return [...items].sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.price - b.price;
  });
}

/**
 * Group items by category
 */
export function groupItemsByCategory(items: ShopItem[]): Record<ShopCategory, ShopItem[]> {
  const grouped: Record<ShopCategory, ShopItem[]> = {
    color: [],
    decal: [],
    decoration: [],
    effect: [],
    boost: [],
    special: [],
  };

  items.forEach(item => {
    grouped[item.category].push(item);
  });

  return grouped;
}

/**
 * Check if user can afford item
 */
export function canAfford(userCoins: number, itemPrice: number): boolean {
  return userCoins >= itemPrice;
}

/**
 * Get transaction type label
 */
export function getTransactionLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    daily_claim: 'Daily Claim',
    achievement: 'Achievement',
    streak_bonus: 'Streak Bonus',
    purchase: 'Purchase',
    gift_sent: 'Gift Sent',
    gift_received: 'Gift Received',
    admin: 'Admin',
    refund: 'Refund',
  };
  return labels[type];
}

/**
 * Get transaction icon
 */
export function getTransactionIcon(type: TransactionType): string {
  const icons: Record<TransactionType, string> = {
    daily_claim: '🎁',
    achievement: '🏆',
    streak_bonus: '🔥',
    purchase: '🛒',
    gift_sent: '📤',
    gift_received: '📥',
    admin: '⚙️',
    refund: '↩️',
  };
  return icons[type];
}
