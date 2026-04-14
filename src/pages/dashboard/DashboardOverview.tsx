import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Check, Music, Loader2, MoreHorizontal, Lock, ArrowUp, AlertTriangle, Star, Zap, Info, PartyPopper } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const SCORE_COLORS = [
  { key: 'consistency', label: 'Consistency', barClass: 'metric-bar-consistency' },
  { key: 'growth', label: 'Growth', barClass: 'metric-bar-growth' },
  { key: 'engagement', label: 'Engagement', barClass: 'metric-bar-engagement' },
  { key: 'reach', label: 'Reach', barClass: 'metric-bar-reach' },
  { key: 'momentum', label: 'Momentum', barClass: 'metric-bar-momentum' },
];

/* ── Brand Platform Icons (inline SVGs for recognizable icons) ── */
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#EF4444">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#fff"/>
    </svg>
  );
}
function AppleMusicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#FA233B">
      <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0 0 19.7.263C19.042.093 18.373.033 17.7.014 17.412.003 17.124 0 16.836 0H7.163c-.29 0-.58.003-.87.015-.67.018-1.34.08-1.995.25A5.023 5.023 0 0 0 2.426.89c-1.118.733-1.863 1.733-2.18 3.044a9.199 9.199 0 0 0-.24 2.19c-.004.29-.007.58-.006.87v10.01c0 .29.002.58.006.87a9.23 9.23 0 0 0 .24 2.19c.317 1.31 1.062 2.31 2.18 3.044a5.023 5.023 0 0 0 1.87.625c.657.17 1.326.23 1.996.249.29.012.58.015.87.015h9.674c.29 0 .58-.003.87-.015.67-.018 1.34-.08 1.995-.25a5.023 5.023 0 0 0 1.87-.624c1.118-.733 1.863-1.733 2.18-3.043.126-.558.197-1.13.24-1.704V7.006c.001-.294-.001-.587-.006-.882zM17.9 12.092v4.94c0 .192-.015.383-.05.57-.09.5-.367.886-.8 1.13a1.86 1.86 0 0 1-.87.28c-.51.03-1.01-.09-1.44-.35a1.54 1.54 0 0 1-.77-1.12 1.55 1.55 0 0 1 .53-1.41c.36-.31.8-.49 1.26-.58.3-.06.6-.1.9-.17.22-.05.37-.18.43-.39.02-.07.03-.14.03-.22V9.85c0-.2-.08-.34-.27-.39l-5.04 1.18v6.43c0 .24-.02.48-.06.71-.09.5-.37.89-.8 1.13-.32.18-.67.27-1.04.3-.5.03-1-.09-1.43-.35a1.54 1.54 0 0 1-.77-1.12c-.06-.41.05-.78.28-1.11.26-.37.63-.59 1.04-.72.26-.08.52-.14.78-.2.34-.08.56-.28.6-.63.01-.06.01-.12.01-.18V7.604c0-.33.1-.58.4-.73.17-.09.35-.14.54-.18l5.8-1.36c.15-.03.3-.06.44-.06.36 0 .58.21.6.57.01.06.01.12.01.18v6.064z"/>
    </svg>
  );
}

const PLATFORM_ICON_MAP: Record<string, { icon: () => JSX.Element; label: string; bgColor: string }> = {
  youtube:     { icon: YouTubeIcon,    label: 'YouTube',     bgColor: 'rgba(239,68,68,0.12)' },
  spotify:     { icon: SpotifyIcon,    label: 'Spotify',     bgColor: 'rgba(29,185,84,0.12)' },
  instagram:   { icon: InstagramIcon,  label: 'Instagram',   bgColor: 'rgba(236,72,153,0.12)' },
  tiktok:      { icon: TikTokIcon,     label: 'TikTok',      bgColor: 'rgba(167,139,250,0.12)' },
  apple_music: { icon: AppleMusicIcon, label: 'Apple Music', bgColor: 'rgba(250,35,59,0.12)' },
};

/* ── Health Gauge with dramatic glow ── */
function HealthGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 sm:w-52 sm:h-52 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="health-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45, 95%, 65%)" />
            <stop offset="40%" stopColor="hsl(35, 92%, 55%)" />
            <stop offset="100%" stopColor="hsl(15, 85%, 45%)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(25, 10%, 14%)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke="url(#health-grad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          filter="url(#glow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline">
          <span className="text-4xl sm:text-6xl font-bold text-foreground">{score}</span>
          <span className="text-base sm:text-xl text-muted-foreground ml-1">/100</span>
        </div>
        <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.2em]">Artist Health Score</span>
      </div>
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#EF4444', spotify: '#22C55E', instagram: '#EC4899', tiktok: '#A78BFA', apple_music: '#F472B6',
};

/* ── YouTube Audit Card (from youtube_audit table) ── */
const AUDIT_CATEGORIES: { label: string; fields: { key: string; label: string }[] }[] = [
  { label: 'Shorts', fields: [{ key: 'shorts_publishing', label: 'Publishing' }, { key: 'shorts_optimization', label: 'Optimization' }, { key: 'shorts_cta', label: 'CTA' }] },
  { label: 'Playlists', fields: [{ key: 'playlists_status', label: 'Status' }, { key: 'playlists_optimization', label: 'Optimization' }, { key: 'playlists_traffic', label: 'Traffic' }] },
  { label: 'Thumbnails', fields: [{ key: 'thumbnails_custom_design', label: 'Custom Design' }, { key: 'thumbnails_ctr', label: 'CTR' }] },
  { label: 'Community', fields: [{ key: 'community_frequent_posts', label: 'Posts' }, { key: 'community_music_promotion', label: 'Music Promo' }, { key: 'community_discussions', label: 'Discussions' }] },
  { label: 'Other', fields: [{ key: 'end_screens_status', label: 'End Screens' }, { key: 'cards_status', label: 'Cards' }, { key: 'description_quality', label: 'Descriptions' }, { key: 'channel_cover_status', label: 'Cover' }, { key: 'artist_profile_status', label: 'Profile' }] },
  { label: 'Video SEO', fields: [{ key: 'titles_tags_quality', label: 'Titles & Tags' }, { key: 'keywords_in_desc', label: 'Keywords' }, { key: 'artist_ranking_keywords', label: 'Ranking' }] },
  { label: 'Channel SEO', fields: [{ key: 'channel_tags_status', label: 'Tags' }, { key: 'channel_seo_optimization', label: 'SEO' }, { key: 'backlinks_structure', label: 'Backlinks' }] },
];

const DOT_COLORS: Record<string, string> = { green: 'bg-success', yellow: 'bg-yellow-500', red: 'bg-destructive' };

function YouTubeAuditCard({ audit }: { audit: any | null }) {
  if (!audit) {
    return (
      <div className="glass-card p-4 sm:p-6 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
            <YouTubeIcon />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-foreground">YouTube Audit</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Music className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Auditul YouTube va fi disponibil în curând.</p>
        </div>
      </div>
    );
  }

  const overallScore = audit.overall_score ?? 0;
  const starsRating = parseFloat(audit.stars_rating) || 0;
  const generalSeo = audit.general_seo_score ?? 0;
  const videoSeo = audit.video_seo_score ?? 0;
  const interaction = audit.interaction_score ?? 0;
  const auditDate = audit.audit_date ? new Date(audit.audit_date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (overallScore / 100) * circumference;
  const scoreColor = overallScore >= 70 ? 'hsl(142, 71%, 45%)' : overallScore >= 40 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)';

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const partial = rating - full;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < full ? 'text-yellow-400 fill-yellow-400' : i === full && partial > 0 ? 'text-yellow-400' : 'text-muted-foreground/30'}`}
            style={i === full && partial > 0 ? { clipPath: `inset(0 ${(1 - partial) * 100}% 0 0)`, fill: 'currentColor' } : undefined}
          />
        ))}
        <span className="text-xs sm:text-sm font-bold text-foreground ml-1.5">{starsRating.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground">/5</span>
      </div>
    );
  };

  const progressBar = (label: string, value: number) => {
    const color = value >= 70 ? 'bg-success' : value >= 40 ? 'bg-yellow-500' : 'bg-destructive';
    return (
      <div key={label}>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold text-foreground">{value}%</span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-4 sm:p-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
            <YouTubeIcon />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">YouTube Audit</h2>
            {audit.platform_account_id && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">{audit.platform_account_id}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {renderStars(starsRating)}
          <span className="text-[10px] sm:text-xs text-muted-foreground border-l border-border/50 pl-3">{auditDate}</span>
        </div>
      </div>

      {/* Score + Progress Bars */}
      <div className="flex flex-col sm:flex-row gap-5 mb-5">
        {/* Circular score */}
        <div className="flex justify-center sm:justify-start">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted)/0.3)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">{overallScore}</span>
              <span className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">Overall</span>
            </div>
          </div>
        </div>
        {/* 3 progress bars */}
        <div className="flex-1 space-y-3 justify-center flex flex-col">
          {progressBar('General SEO', generalSeo)}
          {progressBar('Video SEO', videoSeo)}
          {progressBar('Interaction', interaction)}
        </div>
      </div>

      {/* Category dots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {AUDIT_CATEGORIES.map(cat => (
          <div key={cat.label} className="bg-muted/20 rounded-xl p-3 border border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-2">{cat.label}</h4>
            <div className="space-y-1.5">
              {cat.fields.map(f => {
                const val: string = audit[f.key] || 'red';
                return (
                  <div key={f.key} className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${DOT_COLORS[val] || 'bg-muted-foreground/30'}`} />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
/* ── Personalized Recommendations Card ── */
interface Recommendation {
  indicator: string;
  status: 'red' | 'yellow';
  category: string;
  priority: number;
  issue: string;
  action: string;
  impact: string;
  effort: string;
}

function PersonalizedRecommendationsCard({ recs, loading: isLoading }: { recs: Recommendation[]; loading: boolean }) {
  const [tab, setTab] = useState<'all' | 'red' | 'yellow'>('all');

  if (isLoading) {
    return (
      <div className="glass-card p-4 sm:p-6 relative z-10 space-y-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-8 w-72" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    );
  }

  if (!recs || recs.length === 0) {
    return (
      <div className="glass-card p-4 sm:p-6 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Recomandări Personalizate</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <PartyPopper className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Nu ai recomandări active — super treabă!</p>
        </div>
      </div>
    );
  }

  const sorted = [...recs].sort((a, b) => a.priority - b.priority);
  const filtered = tab === 'all' ? sorted : sorted.filter(r => r.status === tab);
  const redCount = recs.filter(r => r.status === 'red').length;
  const yellowCount = recs.filter(r => r.status === 'yellow').length;

  const tabs: { key: 'all' | 'red' | 'yellow'; label: string; count: number }[] = [
    { key: 'all', label: 'Toate', count: recs.length },
    { key: 'red', label: 'Urgente', count: redCount },
    { key: 'yellow', label: 'Atenție', count: yellowCount },
  ];

  const effortBadge = (effort: string) => {
    const lower = effort?.toLowerCase() || '';
    const color = lower.includes('mic') ? 'bg-success/20 text-success' : 'bg-yellow-500/20 text-yellow-400';
    return <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{effort}</span>;
  };

  return (
    <div className="glass-card p-4 sm:p-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Recomandări Personalizate</h2>
          <Badge className="text-[10px] sm:text-xs bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">{recs.length}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'bg-primary/20 text-primary'
                : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-primary/30' : 'bg-muted/30'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Accordion */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nicio recomandare în această categorie.</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map((rec, idx) => {
            const isRed = rec.status === 'red';
            const statusColor = isRed ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#eab308]/20 text-[#eab308]';
            const statusLabel = isRed ? 'URGENT' : 'ATENȚIE';
            const StatusIcon = isRed ? Zap : Info;
            const truncatedIssue = rec.issue.length > 80 ? rec.issue.slice(0, 80) + '…' : rec.issue;

            return (
              <AccordionItem key={idx} value={`rec-${idx}`} className="border border-border/30 rounded-xl overflow-hidden bg-muted/10">
                <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline hover:bg-muted/20 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left">
                    <StatusIcon className="h-4 w-4 shrink-0" style={{ color: isRed ? '#ef4444' : '#eab308' }} />
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{rec.category}</span>
                    <span className="text-xs sm:text-sm text-foreground truncate">{truncatedIssue}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 ml-auto hidden sm:inline">
                      Prioritate #{rec.priority}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 sm:px-4 pb-4 pt-1">
                  <div className="space-y-3 pl-6 sm:pl-9">
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider mb-1">Ce de făcut:</p>
                      <p className="text-xs sm:text-sm text-foreground/90">{rec.action}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider mb-1">Impact așteptat:</p>
                      <p className="text-xs sm:text-sm text-foreground/90">{rec.impact}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">Efort:</p>
                      {effortBadge(rec.effort)}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<any[]>([]);
  const [ytAudit, setYtAudit] = useState<any>(null);
  const [personalRecs, setPersonalRecs] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [completedTodos, setCompletedTodos] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split('T')[0];

      const [profileRes, metricsRes, healthRes, recsRes, platformsRes, ytAuditRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('metrics_daily').select('*').eq('user_id', user.id).gte('metric_date', sinceStr).order('metric_date', { ascending: true }),
        supabase.from('artist_health_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(1),
        supabase.from('daily_recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('artist_platforms').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('youtube_audit').select('*').eq('user_id', user.id).order('audit_date', { ascending: false }).limit(1),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setMetrics(metricsRes.data || []);
      if (healthRes.data?.[0]) setHealthScore(healthRes.data[0]);
      setRecommendations(recsRes.data || []);
      setConnectedPlatforms(platformsRes.data || []);
      const auditData = ytAuditRes.data?.[0] || null;
      setYtAudit(auditData);
      const rawRecs = auditData?.recommendations;
      const recsArray = Array.isArray(rawRecs) ? rawRecs : Array.isArray(rawRecs?.items) ? rawRecs.items : [];
      setPersonalRecs(recsArray);
      setRecsLoading(false);
      setLoading(false);
    };
    loadData();
  }, [user, period]);

  const chartData = useMemo(() => {
    const byDate: Record<string, any> = {};
    metrics.forEach(m => {
      if (!byDate[m.metric_date]) byDate[m.metric_date] = { date: m.metric_date };
      byDate[m.metric_date][m.platform] = m.followers || 0;
    });
    return Object.values(byDate);
  }, [metrics]);

  const activePlatforms = useMemo(() => [...new Set(metrics.map(m => m.platform))], [metrics]);

  const kpis = useMemo(() => {
    if (metrics.length === 0) return { followers: 0, engagement: 0, views: 0, activity: 0, followerGrowth: 0, engagementGrowth: 0, viewsGrowth: 0, daysSinceLastPost: 0 };
    const latest: Record<string, any> = {};
    const earliest: Record<string, any> = {};
    metrics.forEach(m => {
      if (!latest[m.platform] || m.metric_date > latest[m.platform].metric_date) latest[m.platform] = m;
      if (!earliest[m.platform] || m.metric_date < earliest[m.platform].metric_date) earliest[m.platform] = m;
    });
    const latestVals = Object.values(latest);
    const totalFollowers = latestVals.reduce((s, v) => s + (v.followers || 0), 0);
    const totalViews = latestVals.reduce((s, v) => s + (v.total_views || 0), 0);
    const avgEngagement = latestVals.length ? latestVals.reduce((s, v) => s + (parseFloat(v.engagement_rate) || 0), 0) / latestVals.length : 0;

    const earliestFollowers = Object.values(earliest).reduce((s, v) => s + (v.followers || 0), 0);
    const earliestViews = Object.values(earliest).reduce((s, v) => s + (v.total_views || 0), 0);
    const earliestEngagement = Object.values(earliest).length ? Object.values(earliest).reduce((s, v) => s + (parseFloat(v.engagement_rate) || 0), 0) / Object.values(earliest).length : 0;

    const followerGrowth = earliestFollowers > 0 ? ((totalFollowers - earliestFollowers) / earliestFollowers * 100) : 0;
    const viewsGrowth = earliestViews > 0 ? ((totalViews - earliestViews) / earliestViews * 100) : 0;
    const engagementGrowth = earliestEngagement > 0 ? ((avgEngagement - earliestEngagement) / earliestEngagement * 100) : 0;

    const daysSinceLastPost = latestVals.reduce((min, v) => {
      const d = v.days_since_last_post || 0;
      return d > 0 && (min === 0 || d < min) ? d : min;
    }, 0);

    return {
      followers: totalFollowers,
      engagement: avgEngagement,
      views: totalViews,
      activity: latestVals.reduce((s, v) => s + (v.posts_count || 0) + (v.videos_count || 0), 0),
      followerGrowth: parseFloat(followerGrowth.toFixed(1)),
      engagementGrowth: parseFloat(engagementGrowth.toFixed(1)),
      viewsGrowth: parseFloat(viewsGrowth.toFixed(1)),
      daysSinceLastPost,
    };
  }, [metrics]);

  const subscores = useMemo(() => {
    if (!healthScore) return [];
    return SCORE_COLORS.map(s => ({ ...s, value: healthScore[`${s.key}_score`] || 0 }));
  }, [healthScore]);

  const todos = useMemo(() => {
    if (recommendations.length > 0) {
      return recommendations.slice(0, 4).map((r, i) => ({
        text: r.recommendation || r.title || r.content || 'Recomandare',
        priority: r.priority || (i === 0 ? 'high' : 'medium'),
      }));
    }
    const fallback: { text: string; priority: string }[] = [];
    if (activePlatforms.includes('spotify')) fallback.push({ text: 'Post Spotify pre-save link', priority: 'high' });
    if (activePlatforms.includes('tiktok')) fallback.push({ text: 'Schedule TikTok content', priority: 'high' });
    if (activePlatforms.includes('youtube')) fallback.push({ text: 'Update tour dates on website', priority: 'medium' });
    if (activePlatforms.includes('instagram')) fallback.push({ text: 'Connect with playlist curators', priority: 'low' });
    if (fallback.length === 0) fallback.push({ text: 'Conectează-ți platformele', priority: 'high' });
    return fallback.slice(0, 4);
  }, [recommendations, activePlatforms]);

  const toggleTodo = (idx: number) => {
    setCompletedTodos(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const getMomentumLabel = (score: number) => {
    if (score >= 80) return { label: 'GROWING', color: 'text-success' };
    if (score >= 50) return { label: 'STABLE', color: 'text-primary' };
    return { label: 'DECLINING', color: 'text-destructive' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const momentum = getMomentumLabel(healthScore?.momentum_score || 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in sparkle-container warm-gradient-top">
      <p className="text-sm font-medium text-muted-foreground relative z-10">Dashboard</p>

      {/* Health Score + Subscores + KPI Cards */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5 relative z-10">
        {/* Health Score Gauge + Subscores */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <HealthGauge score={healthScore?.overall_score || 0} />
            <div className="flex-1 w-full space-y-2.5 sm:space-y-3.5">
              {subscores.map(s => {
                const barColor = s.value >= 70
                  ? 'bg-success'
                  : s.value >= 40
                    ? 'bg-yellow-500'
                    : 'bg-destructive';
                return (
                  <div key={s.key}>
                    <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-semibold text-foreground">{s.value}%</span>
                    </div>
                    <div className="h-2.5 sm:h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
                        style={{ width: `${s.value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="glass-card p-3 sm:p-4 flex flex-col items-center justify-center text-center backdrop-blur-lg">
            <span className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Total Reach</span>
            <span className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(kpis.followers)}</span>
            {kpis.followerGrowth !== 0 && (
              <span className={`text-[10px] sm:text-xs flex items-center gap-0.5 mt-0.5 sm:mt-1 ${kpis.followerGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                <ArrowUp className={`h-3 w-3 ${kpis.followerGrowth < 0 ? 'rotate-180' : ''}`} />
                {kpis.followerGrowth >= 0 ? '+' : ''}{kpis.followerGrowth}%
              </span>
            )}
          </div>
          <div className="glass-card p-3 sm:p-4 flex flex-col items-center justify-center text-center backdrop-blur-lg">
            <span className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Engagement Rate</span>
            <span className="text-xl sm:text-2xl font-bold text-foreground">{kpis.engagement.toFixed(1)}%</span>
            {kpis.engagementGrowth !== 0 && (
              <span className={`text-[10px] sm:text-xs flex items-center gap-0.5 mt-0.5 sm:mt-1 ${kpis.engagementGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                <ArrowUp className={`h-3 w-3 ${kpis.engagementGrowth < 0 ? 'rotate-180' : ''}`} />
                {kpis.engagementGrowth >= 0 ? '+' : ''}{kpis.engagementGrowth}%
              </span>
            )}
          </div>
          <div className="glass-card p-3 sm:p-4 flex flex-col items-center justify-center text-center backdrop-blur-lg">
            <span className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Momentum</span>
            <span className={`text-xl sm:text-3xl font-extrabold tracking-tight ${momentum.color}`}>{momentum.label}</span>
            <ArrowUp className={`h-5 w-5 sm:h-8 sm:w-8 mt-0.5 sm:mt-1 ${momentum.color}`} strokeWidth={3} />
          </div>
          <div className="glass-card p-3 sm:p-4 flex flex-col items-center justify-center text-center backdrop-blur-lg">
            <span className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Days Since Last Post</span>
            <span className={`text-xl sm:text-3xl font-bold ${kpis.daysSinceLastPost > 3 ? 'text-destructive' : kpis.daysSinceLastPost > 1 ? 'text-primary' : 'text-foreground'}`}>
              {kpis.daysSinceLastPost > 0 ? kpis.daysSinceLastPost : '—'}
            </span>
            {kpis.daysSinceLastPost > 3 && <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 sm:mt-1" />}
            {kpis.daysSinceLastPost > 0 && kpis.daysSinceLastPost <= 3 && (
              <span className="text-[10px] sm:text-xs font-medium text-foreground uppercase tracking-wider">Days</span>
            )}
          </div>
        </div>
      </div>

      {/* Daily Focus + Benchmark + Platform Status */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 relative z-10">
        {/* Daily Focus Checklist */}
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Daily Focus Checklist</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2">
            {todos.map((t, i) => {
              const done = completedTodos.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleTodo(i)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all text-left ${
                    done ? 'bg-success/10 text-muted-foreground line-through' : 'bg-muted/20 hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    done ? 'bg-success border-success' : 'border-success/40'
                  }`}>
                    {done && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-success-foreground" />}
                  </div>
                  <span className="flex-1 line-clamp-2">{t.text}</span>
                  {!done && t.priority === 'high' && (
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] text-primary border-primary/30 shrink-0 hidden sm:inline-flex">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> High
                    </Badge>
                  )}
                  {done && <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="glass-card p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Benchmark Comparison</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className={`${profile?.plan === 'free' ? 'blur-sm select-none' : ''}`}>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs sm:text-sm min-w-[280px]">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left pb-2 text-muted-foreground font-medium"></th>
                    <th className="text-right pb-2 text-muted-foreground font-medium text-[10px] sm:text-xs">Artist</th>
                    <th className="text-right pb-2 text-muted-foreground font-medium text-[10px] sm:text-xs">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {[
                    { label: 'Growth', artist: `${kpis.followerGrowth >= 0 ? '+' : ''}${kpis.followerGrowth}%`, avg: '+1.8%', positive: kpis.followerGrowth >= 1.8 },
                    { label: 'Engagement', artist: `${kpis.engagement.toFixed(1)}%`, avg: '3.5%', positive: kpis.engagement >= 3.5 },
                    { label: 'Reach', artist: formatNumber(kpis.views), avg: formatNumber(50000), positive: kpis.views >= 50000 },
                    { label: 'Streams', artist: formatNumber(kpis.followers), avg: formatNumber(10000), positive: kpis.followers >= 10000 },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="py-2 text-foreground">{row.label}</td>
                      <td className={`py-2 text-right font-medium ${row.positive ? 'text-success' : 'text-destructive'}`}>{row.artist}</td>
                      <td className="py-2 text-right text-muted-foreground">{row.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {profile?.plan === 'free' && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground mb-2 text-sm">Disponibil în Pro</p>
                <Button size="sm" asChild><Link to="/pricing">Upgrade</Link></Button>
              </div>
            </div>
          )}
        </div>

        {/* Platform Status */}
        <div className="glass-card p-4 sm:p-5 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Platform Status</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2.5 sm:space-y-3">
            {Object.entries(PLATFORM_ICON_MAP).map(([key, p]) => {
              const isConnected = connectedPlatforms.some(c => c.platform === key);
              const IconComponent = p.icon;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: p.bgColor }}>
                      <IconComponent />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">{p.label}</span>
                  </div>
                  {isConnected ? (
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] text-success border-success/30 bg-success/10 px-2">
                      <Check className="h-3 w-3 mr-0.5 sm:mr-1" /> OK
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] text-muted-foreground border-border px-2">
                      OFF
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* YouTube Audit */}
      <YouTubeAuditCard audit={ytAudit} />

      {/* Recomandări Personalizate */}
      <PersonalizedRecommendationsCard recs={personalRecs} loading={recsLoading} />

      {/* Followers Chart */}
      <div className="glass-card p-4 sm:p-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Followers per platformă</h2>
          <div className="flex gap-1">
            {['7d', '30d', '90d', '1y'].map(p => (
              <Button key={p} variant={period === p ? 'default' : 'ghost'} size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3" onClick={() => setPeriod(p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} width={40} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {activePlatforms.map(p => (
                <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_COLORS[p] || '#888'} strokeWidth={2} dot={false} name={p.charAt(0).toUpperCase() + p.slice(1)} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Music className="h-10 w-10 mb-3" />
            <p className="text-sm">Încă nu sunt suficiente date. Așteaptă colectarea zilnică.</p>
          </div>
        )}
      </div>
    </div>
  );
}
