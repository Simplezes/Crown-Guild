'use client';

import React from 'react';
import styles from './InfoTrigger.module.css';

export default function InfoTrigger({ content, title, position = 'top' }) {
  const containerRef = React.useRef(null);
  const [autoAlign, setAutoAlign] = React.useState('');

  const handlePointerEnter = () => {
    if (containerRef.current && window.innerWidth <= 768) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.left > window.innerWidth / 2) {
        setAutoAlign(styles.alignRight);
      } else {
        setAutoAlign(styles.alignLeft);
      }
    } else {
      setAutoAlign('');
    }
  };

  const positionClass = {
    top: '',
    left: styles.tooltipLeft,
    right: styles.tooltipRight,
    bottom: styles.tooltipBottom
  }[position] || '';

  return (
    <span 
      className={styles.container} 
      ref={containerRef}
      onMouseEnter={handlePointerEnter}
      onTouchStart={handlePointerEnter}
    >
      <button
        className={styles.trigger}
        aria-label="More information"
        type="button"
      >
        i
      </button>
      <div className={`${styles.tooltip} ${positionClass} ${autoAlign}`.trim()}>
        {title && <span className={styles.tooltipTitle}>{title}</span>}
        <span className={styles.tooltipContent}>{content}</span>
      </div>
    </span>
  );
}
