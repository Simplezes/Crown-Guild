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
      <span className={styles.toggleText}>
        <span className={`${styles.textOn} ${!checked ? styles.textHidden : ""}`}>{labelOn}</span>
        <span className={`${styles.textOff} ${checked ? styles.textHidden : ""}`}>{labelOff}</span>
      </span>
    </label>
  );
}
