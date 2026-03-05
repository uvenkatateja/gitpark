/**
 * Welcome Back Modal Component
 * Shows returning user information and activity summary
 */

import { useEffect, useState } from 'react';
import { X, Calendar, TrendingUp, Star, Package } from 'lucide-react';
import type { GitHubUser, GitHubRepo } from '@/lib/github';
import { getUserTitle } from '@/lib/devTitles';

interface WelcomeBackModalProps {
  user: GitHubUser;
  repos: GitHubRepo[];
}

interface VisitData {
  lastVisit: string;
  visitCount: number;
}

export default function WelcomeBackModal({ user, repos }: WelcomeBackModalProps) {
  const [show, setShow] = useState(false);
  const [visitData, setVisitData] = useState<VisitData | null>(null);
  const [daysAway, setDaysAway] = useState(0);

  useEffect(() => {
    // Get visit data from localStorage
    const storageKey = `repo-ridez-visit-${user.login}`;
    const stored = localStorage.getItem(storageKey);
    
    const now = new Date();
    const currentVisit = {
      lastVisit: now.toISOString(),
      visitCount: 1,
    };

    if (stored) {
      try {
        const data: VisitData = JSON.parse(stored);
        const lastVisit = new Date(data.lastVisit);
        const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        
        // Show modal if user was away for at least 1 day
        if (daysSinceLastVisit >= 1) {
          setVisitData(data);
          setDaysAway(daysSinceLastVisit);
          setShow(true);
        }
        
        // Update visit data
        currentVisit.visitCount = data.visitCount + 1;
      } catch (error) {
        console.error('Failed to parse visit data:', error);
      }
    }
    
    // Save current visit
    localStorage.setItem(storageKey, JSON.stringify(currentVisit));
  }, [user.login]);

  const handleClose = () => {
    setShow(false);
  };

  if (!show || !visitData) return null;

  const title = getUserTitle(user, repos);
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  
  // Calculate activity since last visit
  const lastVisitDate = new Date(visitData.lastVisit);
  const recentRepos = repos.filter(r => new Date(r.created_at) > lastVisitDate);
  const recentUpdates = repos.filter(r => new Date(r.pushed_at) > lastVisitDate);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-4 mb-4">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-16 h-16 rounded-full border-2 border-primary shadow-lg"
              />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Welcome Back!
                </h2>
                <p className="text-sm text-muted-foreground">
                  @{user.login}
                </p>
              </div>
            </div>

            {/* Days Away */}
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/40 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">
                You've been away for{' '}
                <span className="font-bold text-primary">
                  {daysAway} {daysAway === 1 ? 'day' : 'days'}
                </span>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Title */}
              <div className="col-span-2 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{title.icon}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Your Title
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{title.name}</p>
              </div>

              {/* Total Repos */}
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Repos</span>
                </div>
                <p className="text-xl font-bold text-foreground">{repos.length}</p>
              </div>

              {/* Total Stars */}
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">Stars</span>
                </div>
                <p className="text-xl font-bold text-foreground">{totalStars}</p>
              </div>
            </div>
          </div>

          {/* Activity Since Last Visit */}
          {(recentRepos.length > 0 || recentUpdates.length > 0) && (
            <div className="px-6 pb-4">
              <div className="p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Activity Since Last Visit
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {recentRepos.length > 0 && (
                    <p>🎉 {recentRepos.length} new {recentRepos.length === 1 ? 'repository' : 'repositories'}</p>
                  )}
                  {recentUpdates.length > 0 && (
                    <p>📝 {recentUpdates.length} {recentUpdates.length === 1 ? 'update' : 'updates'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Visit Count */}
          <div className="px-6 pb-6">
            <p className="text-xs text-center text-muted-foreground">
              Visit #{visitData.visitCount} • Keep up the great work! 🚀
            </p>
          </div>

          {/* Action Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-primary hover:bg-primary/80 text-primary-foreground font-semibold rounded-lg transition-colors"
            >
              Let's Go!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
