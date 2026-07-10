'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export default function InfoTrigger({ content, title, position = 'top' }) {
  const containerRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const tooltipRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [tooltipState, setTooltipState] = React.useState({
    side: 'top',
    align: 'center',
    style: { top: 0, left: 0, maxWidth: '320px' },
  });

  const updateTooltipPosition = React.useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;
    const gap = 10;
    const tooltipWidth = Math.min(320, Math.max(220, viewportWidth - margin * 2));
    const estimatedHeight = tooltipRef.current?.offsetHeight || 120;
    const preferredSide = position === 'bottom' ? 'bottom' : 'top';
    const canFitTop = rect.top >= estimatedHeight + gap + margin;
    const canFitBottom = viewportHeight - rect.bottom >= estimatedHeight + gap + margin;

    let side = preferredSide;
    if (preferredSide === 'top' && !canFitTop && canFitBottom) side = 'bottom';
    if (preferredSide === 'bottom' && !canFitBottom && canFitTop) side = 'top';

    let align = 'center';
    let left = rect.left + rect.width / 2;

    if (left - tooltipWidth / 2 < margin) {
      align = 'left';
      left = margin;
    } else if (left + tooltipWidth / 2 > viewportWidth - margin) {
      align = 'right';
      left = viewportWidth - margin - tooltipWidth;
    } else {
      left -= tooltipWidth / 2;
    }

    const top = side === 'top'
      ? Math.max(margin, rect.top - estimatedHeight - gap)
      : Math.min(viewportHeight - margin - estimatedHeight, rect.bottom + gap);

    setTooltipState({
      side,
      align,
      style: {
        top,
        left,
        maxWidth: `${tooltipWidth}px`,
      },
    });
  }, [position]);

  React.useEffect(() => {
    if (!open) return;

    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);

    const handlePointerDown = (event) => {
      const target = event.target;
      if (containerRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, updateTooltipPosition]);

  React.useLayoutEffect(() => {
    if (open) updateTooltipPosition();
  }, [open, content, title, updateTooltipPosition]);

  const openTooltip = () => setOpen(true);
  const closeTooltip = () => setOpen(false);
  const toggleTooltip = () => setOpen((current) => !current);

  const arrowSide = tooltipState.side === 'bottom'
    ? 'bottom-full border-b-ember border-t-transparent'
    : 'top-full border-t-ember border-b-transparent';
  const arrowAlign = tooltipState.align === 'left'
    ? 'left-3.5'
    : tooltipState.align === 'right'
      ? 'right-3.5'
      : 'left-1/2 -translate-x-1/2';

  const tooltip = open ? createPortal(
    <div
      ref={tooltipRef}
      style={tooltipState.style}
      role="tooltip"
      className="fixed z-[100000] rounded border border-ember bg-void-raised p-3 shadow-lift"
    >
      <span className={`absolute h-0 w-0 border-x-[6px] border-x-transparent border-[6px] ${arrowSide} ${arrowAlign}`} />
      {title && <span className="mb-1.5 block border-b border-white/10 pb-1 font-display text-xs uppercase tracking-wider text-ember">{title}</span>}
      <span className="block font-body text-sm leading-relaxed text-mist">{content}</span>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <span
        className="relative ml-1.5 inline-flex items-center justify-center align-middle"
        ref={containerRef}
        onMouseEnter={openTooltip}
        onMouseLeave={closeTooltip}
      >
        <button
          ref={triggerRef}
          className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-ember font-display text-[11px] text-ember opacity-70 transition-all hover:scale-110 hover:bg-ember/10 hover:opacity-100"
          aria-label="More information"
          aria-expanded={open}
          type="button"
          onFocus={openTooltip}
          onBlur={closeTooltip}
          onClick={toggleTooltip}
        >
          i
        </button>
      </span>
      {tooltip}
    </>
  );
}
