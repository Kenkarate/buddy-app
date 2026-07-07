"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import FooterNav from "@/components/FooterNav";
import ShareModal from "@/components/ShareModal";

// Mobile shell for user-facing pages (top bar with logo + share, FooterNav).
// Ported from the inline UserLayout that lived in the old client App.jsx.
export default function UserLayout({ children }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="mobile-shell">
      <main className="page-content">
        <div className="app-topbar centered-logo-topbar">
          <div className="topbar-spacer" />

          <img src="/icons/logo.jpeg" alt="Buddy Logo" className="center-app-logo" />

          <button
            className="top-share-btn"
            onClick={() => setShareOpen(true)}
            aria-label="Share Buddy"
          >
            <Share2 size={22} />
          </button>
        </div>

        {children}
      </main>

      <FooterNav />

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
