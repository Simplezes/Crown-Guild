import styles from './MasteryInfo.module.css';
import { MASTERY_RANKS } from '@/lib/profile';

export default function MasteryInfo({ points, rank, nextRank, progress }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.pointsArea}>
          <span className={styles.pointsLabel}>Guild Standing</span>
          <h2 className={styles.pointsValue}>{points} <span className={styles.mpSub}>MP</span></h2>
        </div>
        <div className={styles.rankBadge}>{rank}</div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Mastery Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        {nextRank && (
          <div className={styles.progressFooter}>
            {nextRank.minPoints - points} MP to {nextRank.title}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.mechanics}>
        <h4 className={styles.mechTitle}>Mastery Record Guide</h4>
        <ul className={styles.mechList}>
          <li><span className={styles.mp}>+10 MP</span> Gold Specimen Crown (S/L)</li>
          <li><span className={styles.mp}>+10 MP</span> Full Specimen Completion</li>
          <li><span className={styles.mp}>+25 MP</span> Guild Archive (Discovery)</li>
          <li><span className={styles.mp}>+15 MP</span> Guild Commendation (Renown)</li>
          <li><span className={styles.mp}>+5 MP</span> Share Records (Host Crown)</li>
          <li><span className={styles.mp}>+2 MP</span> Support Hunters (Future co-op features)</li>
        </ul>
        {/* QUEST_SYSTEM_ENABLED: Guild Fever promo hidden while quest system is on hold */}
      </div>
    </div>
  );
}
