/**
 * Share Comparison Button Component
 * Generates and shares comparison image
 * NOTE: Requires html2canvas package: npm install html2canvas
 */

import { useState } from 'react';
import { Share2, Download, Check, Loader2, Link as LinkIcon } from 'lucide-react';
import type { ComparisonSummary } from '@/lib/compareService';

interface ShareComparisonButtonProps {
  summary: ComparisonSummary;
  elementId: string;
}

export default function ShareComparisonButton({
  summary,
  elementId,
}: ShareComparisonButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateImage = async (): Promise<Blob | null> => {
    try {
      // Check if html2canvas is available (optional dependency)
      // Using Function constructor to avoid static analysis
      const importHtml2Canvas = new Function('return import("html2canvas")');
      const html2canvasModule = await importHtml2Canvas();
      const html2canvas = html2canvasModule.default || html2canvasModule;
      
      const element = document.getElementById(elementId);
      if (!element) return null;

      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } catch (error) {
      console.warn('html2canvas not available - image generation disabled');
      return null;
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    const blob = await generateImage();
    setGenerating(false);

    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.user1.user.login}-vs-${summary.user2.user.login}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback: copy link
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    setGenerating(true);
    const blob = await generateImage();
    setGenerating(false);

    if (!blob) {
      // Fallback to link sharing
      try {
        await navigator.share({
          title: `${summary.user1.user.login} vs ${summary.user2.user.login}`,
          text: `Check out this GitHub comparison!`,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
      return;
    }

    try {
      const file = new File(
        [blob],
        `${summary.user1.user.login}-vs-${summary.user2.user.login}.png`,
        { type: 'image/png' }
      );

      await navigator.share({
        title: `${summary.user1.user.login} vs ${summary.user2.user.login}`,
        text: `Check out this GitHub comparison!`,
        files: [file],
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        disabled={generating}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </>
        )}
      </button>

      <button
        onClick={handleCopyLink}
        disabled={generating}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-foreground rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Copy Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      <button
        onClick={handleDownload}
        disabled={generating}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-foreground rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download as Image"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}
