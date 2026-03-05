/**
 * Share Button Component
 * Social media sharing with dynamic content
 */

import { useState } from 'react';
import { Share2, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import type { GitHubUser, GitHubRepo } from '@/lib/github';
import { getUserTitle } from '@/lib/devTitles';

interface ShareButtonProps {
  user: GitHubUser;
  repos: GitHubRepo[];
  compact?: boolean;
}

export default function ShareButton({ user, repos, compact = false }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const title = getUserTitle(user, repos);
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  
  // Generate share text
  const shareText = `Check out my parking lot on Repo-Ridez! 🚗🅿️\n\n${title.icon} ${title.name}\n📦 ${repos.length} repos\n⭐ ${totalStars} stars\n\n`;
  const shareUrl = `${window.location.origin}/lot/${user.login}`;
  
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };
  
  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 2000);
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.login}'s Parking Lot`,
          text: shareText,
          url: shareUrl,
        });
        setShowMenu(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
        title="Share"
      >
        <Share2 className="w-4 h-4 text-primary" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground font-semibold text-sm transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-card/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="p-2 space-y-1">
              <button
                onClick={handleTwitterShare}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <span className="text-sm text-foreground">Share on Twitter</span>
              </button>
              
              <button
                onClick={handleLinkedInShare}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                <span className="text-sm text-foreground">Share on LinkedIn</span>
              </button>
              
              <div className="h-px bg-white/10 my-1" />
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 text-foreground" />
                    <span className="text-sm text-foreground">Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
