"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import HuntRecordForm from "./HuntRecordForm";

export default function CrownLogModal({ isOpen, onClose, initialGroup }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function onEsc(e) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 p-4 py-8" onClick={onClose}>
      <div
        className="animate-mh-slide-down w-full max-w-4xl rounded-2xl border border-white/10 bg-void-raised p-4 shadow-lift sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <HuntRecordForm initialGroup={initialGroup} onClose={onClose} />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
