"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type GlobalDrawerLayerProps = {
  open: boolean;
  label: string;
  onMaskClick?: () => void;
  children: ReactNode;
};

export function GlobalDrawerLayer({ open, label, onMaskClick, children }: GlobalDrawerLayerProps) {
  if (!open) return null;
  return createPortal(
    <div className="global-drawer-root">
      <div className="overlay global-drawer-mask" onClick={onMaskClick} />
      <div className="global-drawer-panel" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>,
    document.body,
  );
}
