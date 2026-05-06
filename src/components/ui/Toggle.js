"use client";

import styles from "./Toggle.module.css";

export default function Toggle({ checked, onChange, labelOn = "On", labelOff = "Off" }) {
  return (
    <label className={styles.toggleLabel}>
      <input
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={onChange}
      />
      <div className={styles.switch}>
        <div className={styles.switchHandle} />
      </div>
      <span className={styles.toggleTextSlot}>
        <span
          className={`${styles.toggleText} ${styles.textOn} ${checked ? styles.textVisible : styles.textHidden}`}
          aria-hidden={!checked}
        >
          {labelOn}
        </span>
        <span
          className={`${styles.toggleText} ${styles.textOff} ${checked ? styles.textHidden : styles.textVisible}`}
          aria-hidden={checked}
        >
          {labelOff}
        </span>
      </span>
    </label>
  );
}
