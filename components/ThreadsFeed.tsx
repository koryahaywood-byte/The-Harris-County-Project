"use client";
import { useState } from "react";

/* Threads-style social feed. Clean white cards, real avatars, optional post images.
   Avatars resolve via unavatar.io from the X handle; falls back to initials. */

export interface ThreadsPost {
  platform: "Threads" | "Facebook" | "Twitter/X";
  author: string;
  handle: string;
  content: string;
  url: string;
  time: string;
  image?: string;   // optional photo attached to the post
  verified?: boolean;
}

function Avatar({ author, handle }: { author: string; handle: string }) {
  const [failed, setFailed] = useState(false);
  const initials = author.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const xHandle = handle.startsWith("@") ? handle.slice(1) : null;
  if (failed || !xHandle) {
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">{initials}</span>
      </div>
    );
  }
  return (
    <img
      src={`https://unavatar.io/twitter/${xHandle}`}
      alt={author}
      className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-gray-100"
      onError={() => setFailed(true)}
    />
  );
}

function PlatformGlyph({ p }: { p: ThreadsPost["platform"] }) {
  if (p === "Threads") return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c0-3.514.85-6.37 2.495-8.483C5.841 1.218 8.589.024 12.175 0h.014c2.312.013 4.296.634 5.896 1.845 1.577 1.189 2.666 2.908 3.237 5.109l-2.002.595c-.448-1.74-1.278-3.109-2.469-4.068-1.178-.946-2.715-1.437-4.658-1.447-2.89.019-5.04.943-6.581 2.819C4.071 6.793 3.456 9.186 3.456 12v.068c0 2.825.615 5.211 1.829 7.093 1.54 1.86 3.691 2.784 6.587 2.803 2.327-.015 4.068-.635 5.325-1.895.973-.971 1.603-2.371 1.873-4.16a7.454 7.454 0 0 0-1.562-.166c-3.018 0-4.699-1.567-4.699-4.296 0-2.681 1.77-4.388 4.508-4.388 2.891 0 4.577 1.786 4.577 4.771 0 .413-.04.82-.12 1.207A7.04 7.04 0 0 1 20 16.5c-1.084 1.084-2.703 1.665-4.682 1.665-1.055 0-2.036-.182-2.908-.54a5.293 5.293 0 0 1-.224 2.375z"/></svg>
  );
  if (p === "Facebook") return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  );
}

function PostCard({ post, isLast }: { post: ThreadsPost; isLast: boolean }) {
  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer"
      className="block group hover:bg-black/[0.015] transition-colors">
      <div className="flex gap-3 px-5 py-4">
        {/* Avatar + thread line */}
        <div className="flex flex-col items-center flex-shrink-0">
          <Avatar author={post.author} handle={post.handle} />
          {!isLast && <div className="w-px flex-1 mt-2 bg-black/8" />}
        </div>
        {/* Body */}
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-1.5 flex-wrap leading-none mb-1">
            <span className="text-[13px] font-bold text-[#1a1a1a]">{post.author}</span>
            {post.verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#0095f6"><path d="M12 1.5l2.61 2.61 3.69-.55.55 3.69L21.5 9.5l-1.65 3.31.55 3.69-3.69.55L14 19.5l-3.31-1.65-3.69.55-.55-3.69L3.5 12.5l1.65-3.31-.55-3.69 3.69-.55L12 1.5z"/><path d="M9.5 12.5l1.75 1.75 3.5-3.75" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            <span className="text-[12px] text-[#999]">{post.handle}</span>
            <span className="text-[#ccc]">·</span>
            <span className="text-[12px] text-[#999]">{post.time}</span>
            <span className="ml-auto text-[#b0b0b0] group-hover:text-[#666] transition-colors"><PlatformGlyph p={post.platform} /></span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-[#2a2a2a] whitespace-pre-line">{post.content}</p>
          {post.image && (
            <div className="mt-2.5 rounded-xl overflow-hidden ring-1 ring-black/8 max-w-md">
              <img src={post.image} alt="" className="w-full h-auto object-cover max-h-72" loading="lazy" />
            </div>
          )}
          {/* Action row: display only */}
          <div className="flex items-center gap-5 mt-2.5 text-[#999]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </div>
        </div>
      </div>
      {!isLast && <div className="h-px bg-black/5 ml-[4.5rem] mr-5" />}
    </a>
  );
}

export default function ThreadsFeed({ posts, footer }: { posts: ThreadsPost[]; footer?: React.ReactNode }) {
  return (
    <div className="max-w-xl">
      {/* Honesty label. These are editorial summaries in feed format, not live posts */}
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
          style={{ background: "#d9770614", color: "#b45309", border: "1px solid #d9770630" }}>
          Curated Digest
        </span>
        <p className="text-[10px] leading-snug" style={{ color: "#9ca3af" }}>
          Written by our newsroom in feed format. Not live social posts. Follow the linked accounts for their actual feeds.
        </p>
      </div>
      <div className="rounded-3xl bg-white ring-1 ring-black/8 overflow-hidden shadow-[0_1px_8px_rgba(26,58,92,0.06)]">
        {posts.map((post, i) => (
          <PostCard key={i} post={post} isLast={i === posts.length - 1} />
        ))}
      </div>
      {footer && <div className="mt-5">{footer}</div>}
    </div>
  );
}
