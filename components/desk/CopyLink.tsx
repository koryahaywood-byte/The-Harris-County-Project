"use client";

import { useState } from "react";

/** Copy the current page URL. Uses the native share sheet on phones when available. */
export default function CopyLink() {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href;
    const title = document.title;
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try { await navigator.share({ title, url }); return; } catch { /* user dismissed */ }
    }
    try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* clipboard blocked */ }
  }
  return (
    <button type="button" onClick={share} className="btn btn-ink w-full justify-center" aria-live="polite">
      {done ? "Link copied" : "Copy link to this race"}
    </button>
  );
}
