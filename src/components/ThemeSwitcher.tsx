/**
 * Theme Switcher Component
 * Allows users to switch between parking lot themes
 */

import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';
import { getAllThemes } from '@/lib/themes';

export default function ThemeSwitcher() {
  const { currentTheme, themeId, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const themes = getAllThemes();

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-full backdrop-blur-md hover:bg-white/10 transition-all group"
        title="Change theme"
      >
        <Palette className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="font-pixel text-[10px] text-muted-foreground group-hover:text-primary transition-colors pt-0.5 tracking-tighter hidden sm:inline">
          {currentTheme.name.toUpperCase()}
        </span>
      </button>

      {/* Theme Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Theme Menu */}
          <div className="absolute top-full right-0 mt-2 z-50 bg-card/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[280px]">
            <div className="px-4 py-3 border-b border-white/5 bg-white/5">
              <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Select Theme
              </span>
            </div>

            <div className="p-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                    themeId === theme.id
                      ? 'bg-primary/20 border border-primary/40'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Theme Color Preview */}
                    <div
                      className="w-8 h-8 rounded-md border border-white/20 shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, ${theme.sky.topColor}, ${theme.sky.bottomColor})`,
                      }}
                    />

                    {/* Theme Info */}
                    <div className="flex flex-col items-start">
                      <span
                        className={`text-sm font-semibold ${
                          themeId === theme.id ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {theme.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground text-left">
                        {theme.description}
                      </span>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {themeId === theme.id && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-white/5 bg-white/5">
              <p className="text-[9px] text-muted-foreground/60 font-mono">
                Theme preference saved locally
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
