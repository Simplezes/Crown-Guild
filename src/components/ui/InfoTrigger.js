'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './InfoTrigger.module.css';

export default function InfoTrigger({ content, title, position = 'top' }) {
  const containerRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const tooltipRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [tooltipState, setTooltipState] = React.useState({
    sideClass: styles.tooltipTop,
    alignClass: styles.alignCenter,
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
      sideClass: side === 'bottom' ? styles.tooltipBottom : styles.tooltipTop,
      alignClass: align === 'left' ? styles.alignLeft : align === 'right' ? styles.alignRight : styles.alignCenter,
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

  const tooltip = open ? createPortal(
    <div
      ref={tooltipRef}
      className={`${styles.tooltip} ${tooltipState.sideClass} ${tooltipState.alignClass}`.trim()}
      style={tooltipState.style}
      role="tooltip"
    >
      {title && <span className={styles.tooltipTitle}>{title}</span>}
      <span className={styles.tooltipContent}>{content}</span>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <span
      className={styles.container}
      ref={containerRef}
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
    >
      <button
        ref={triggerRef}
        className={styles.trigger}
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
