/**
 * Shop Panel Component
 * Main shop interface for browsing and purchasing items
 */

import { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart, Coins, Gift, History, Sparkles, Lock, Check } from 'lucide-react';
import {
  type ShopItem,
  type ShopCategory,
  type InventoryItem,
  fetchShopItems,
  fetchInventory,
  purchaseItem,
  groupItemsByCategory,
  getCategoryLabel,
  getCategoryIcon,
  getRarityColor,
  formatCoins,
  canAfford,
} from '@/lib/shopService';

interface ShopPanelProps {
  parkerId: number;
  userCoins: number;
  onClose: () => void;
  onPurchaseSuccess: (newBalance: number) => void;
}

export default function ShopPanel({
  parkerId,
  userCoins,
  onClose,
  onPurchaseSuccess,
}: ShopPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | 'all'>('all');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadShopData();
  }, [parkerId]);

  const loadShopData = async () => {
    setLoading(true);
    try {
      const [items, inv] = await Promise.all([
        fetchShopItems(),
        fetchInventory(parkerId),
      ]);
      setShopItems(items);
      setInventory(inv);
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = useMemo(() => groupItemsByCategory(shopItems), [shopItems]);
  
  const displayedItems = useMemo(() => {
    if (selectedCategory === 'all') return shopItems;
    return groupedItems[selectedCategory];
  }, [selectedCategory, shopItems, groupedItems]);

  const ownedItemIds = useMemo(
    () => new Set(inventory.map(item => item.itemId)),
    [inventory]
  );

  const handlePurchase = async (item: ShopItem) => {
    if (purchasing || !canAfford(userCoins, item.price) || ownedItemIds.has(item.id)) {
      return;
    }

    setPurchasing(item.id);
    try {
      const result = await purchaseItem(parkerId, item.id);
      
      if (result.success && result.newBalance !== undefined) {
        onPurchaseSuccess(result.newBalance);
        await loadShopData(); // Refresh inventory
      } else {
        alert(result.errorMessage || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-[fade-in_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed z-50 inset-4 sm:inset-8 animate-[slide-up_0.2s_ease-out]">
        <div className="relative bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-xl h-full flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Item Shop</h2>
                  <p className="text-sm text-muted-foreground">Customize your parking experience</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Coin Balance */}
                <div className="flex items-center gap-2 bg-primary/20 border border-primary/40 px-4 py-2 rounded-lg">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary text-lg">{formatCoins(userCoins)}</span>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-3 border-b border-white/10 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                  transition-all flex items-center gap-2
                  ${selectedCategory === 'all'
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }
                `}
              >
                <Sparkles className="w-4 h-4" />
                <span>All Items</span>
              </button>
              {(Object.keys(groupedItems) as ShopCategory[]).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                    transition-all flex items-center gap-2
                    ${selectedCategory === category
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }
                  `}
                >
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <span>{getCategoryLabel(category)}</span>
                  <span className="text-xs opacity-70">({groupedItems[category].length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedItems.map(item => {
                const owned = ownedItemIds.has(item.id);
                const affordable = canAfford(userCoins, item.price);
                const isPurchasing = purchasing === item.id;

                return (
                  <div
                    key={item.id}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all
                      ${owned
                        ? 'border-green-500/40 bg-green-500/10'
                        : affordable
                        ? 'border-white/10 bg-white/5 hover:border-primary/40 hover:bg-white/10'
                        : 'border-white/5 bg-white/5 opacity-60'
                      }
                    `}
                  >
                    {/* Rarity indicator */}
                    <div
                      className="absolute top-2 right-2 w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: getRarityColor(item.rarity),
                        boxShadow: `0 0 10px ${getRarityColor(item.rarity)}40`
                      }}
                    />

                    {/* Owned badge */}
                    {owned && (
                      <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Icon */}
                    <div className="text-4xl mb-3 text-center">{item.icon}</div>

                    {/* Name */}
                    <h3 className="font-bold text-foreground text-center mb-1">{item.name}</h3>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Rarity */}
                    <p
                      className="text-[10px] text-center mb-3 font-pixel uppercase tracking-wider"
                      style={{ color: getRarityColor(item.rarity) }}
                    >
                      {item.rarity}
                    </p>

                    {/* Price & Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-primary" />
                        <span className="font-bold text-foreground">{formatCoins(item.price)}</span>
                      </div>

                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!affordable || owned || isPurchasing}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                          ${owned
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : affordable
                            ? 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 hover:scale-105'
                            : 'bg-white/5 text-muted-foreground cursor-not-allowed'
                          }
                        `}
                      >
                        {isPurchasing ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : owned ? (
                          'Owned'
                        ) : affordable ? (
                          'Buy'
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No items in this category</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>💰 Earn coins through achievements and daily check-ins</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span>Gift feature coming soon!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
