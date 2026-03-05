/**
 * Car Customization Panel
 * Full-screen panel for customizing a car
 */

import { useState, useEffect } from 'react';
import { X, Save, Lock, Sparkles, Check } from 'lucide-react';
import {
  type CarCustomization,
  type CustomizationItem,
  type CustomizationCategory,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  RARITY_STYLES,
  validatePlateText,
  groupItemsByCategory,
} from '@/lib/customization';

interface CarCustomizationPanelProps {
  repoId: number;
  repoName: string;
  currentCustomization: CarCustomization;
  availableItems: CustomizationItem[];
  onSave: (customization: CarCustomization) => Promise<void>;
  onClose: () => void;
}

export default function CarCustomizationPanel({
  repoId,
  repoName,
  currentCustomization,
  availableItems,
  onSave,
  onClose,
}: CarCustomizationPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<CustomizationCategory>('color');
  const [customization, setCustomization] = useState<CarCustomization>(currentCustomization);
  const [plateText, setPlateText] = useState(currentCustomization.plate || '');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const groupedItems = groupItemsByCategory(availableItems);
  const categoryItems = groupedItems[selectedCategory];

  useEffect(() => {
    const changed = JSON.stringify(customization) !== JSON.stringify(currentCustomization);
    setHasChanges(changed);
  }, [customization, currentCustomization]);

  const handleSelectItem = (item: CustomizationItem) => {
    if (!item.isUnlocked) return;

    const newCustomization = { ...customization };

    switch (item.category) {
      case 'color':
        newCustomization.color = item.value;
        break;
      case 'decal':
        const decals = newCustomization.decals || [];
        if (decals.includes(item.value)) {
          newCustomization.decals = decals.filter(d => d !== item.value);
        } else if (decals.length < 3) {
          newCustomization.decals = [...decals, item.value];
        }
        break;
      case 'underglow':
        newCustomization.underglow = item.value;
        break;
      case 'exhaust':
        newCustomization.exhaust = item.value;
        break;
    }

    setCustomization(newCustomization);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validation = validatePlateText(plateText);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      await onSave({ ...customization, plate: plateText || undefined });
      onClose();
    } catch (error) {
      console.error('Failed to save customization:', error);
      alert('Failed to save customization');
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (item: CustomizationItem): boolean => {
    switch (item.category) {
      case 'color':
        return customization.color === item.value;
      case 'decal':
        return customization.decals?.includes(item.value) || false;
      case 'underglow':
        return customization.underglow === item.value;
      case 'exhaust':
        return customization.exhaust === item.value;
      default:
        return false;
    }
  };

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
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Customize Car
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{repoName}</p>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-3 border-b border-white/10 overflow-x-auto">
            <div className="flex gap-2">
              {(Object.keys(CATEGORY_LABELS) as CustomizationCategory[]).map(category => (
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
                  <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                  <span>{CATEGORY_LABELS[category]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedCategory === 'plate_style' ? (
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Custom License Plate
                </label>
                <input
                  type="text"
                  value={plateText}
                  onChange={(e) => setPlateText(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="REPO-RDZ"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40 font-mono text-lg tracking-wider text-center"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Max 8 characters • Letters, numbers, spaces, and hyphens only
                </p>

                {/* Plate Preview */}
                <div className="mt-6 flex justify-center">
                  <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg p-3 shadow-xl border-2 border-yellow-700">
                    <div className="bg-white rounded px-4 py-2">
                      <p className="font-mono font-bold text-2xl text-center tracking-wider text-gray-900">
                        {plateText || 'REPO-RDZ'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categoryItems.map(item => {
                  const rarityStyle = RARITY_STYLES[item.rarity];
                  const selected = isSelected(item);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      disabled={!item.isUnlocked}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all
                        ${item.isUnlocked
                          ? `hover:scale-105 ${selected ? `border-primary bg-primary/20 ${rarityStyle.glow}` : 'border-white/10 bg-white/5 hover:border-white/20'}`
                          : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      {/* Rarity indicator */}
                      <div
                        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${rarityStyle.glow}`}
                        style={{ backgroundColor: rarityStyle.color }}
                      />

                      {/* Selected indicator */}
                      {selected && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {/* Lock indicator */}
                      {!item.isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-white/30" />
                        </div>
                      )}

                      {/* Preview */}
                      <div className="aspect-square rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {item.category === 'color' && (
                          <div
                            className="w-full h-full rounded-lg"
                            style={{ backgroundColor: item.value }}
                          />
                        )}
                        {item.category === 'decal' && (
                          <span className="text-4xl">{CATEGORY_ICONS.decal}</span>
                        )}
                        {item.category === 'underglow' && (
                          <div
                            className="w-full h-2 rounded-full"
                            style={{ backgroundColor: item.value, boxShadow: `0 0 20px ${item.value}` }}
                          />
                        )}
                        {item.category === 'exhaust' && (
                          <div
                            className="w-full h-full rounded-lg opacity-50"
                            style={{ backgroundColor: item.value }}
                          />
                        )}
                      </div>

                      {/* Name */}
                      <p className="text-xs font-medium text-foreground text-center truncate">
                        {item.name}
                      </p>

                      {/* Rarity */}
                      <p
                        className="text-[10px] text-center mt-1 font-pixel uppercase tracking-wider"
                        style={{ color: rarityStyle.color }}
                      >
                        {item.rarity}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
