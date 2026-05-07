import Image from "next/image";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.screen} role="status" aria-live="polite" aria-label="Loading Crown Guild">
      <div className={styles.panel}>
        <Image
          src="/icons/MHWilds-Field_Survey_Icon.png"
          alt=""
          width={64}
          height={64}
          className={`pixel-art ${styles.icon}`}
          priority
        />

        <h2 className={styles.title}>Loading...</h2>
      </div>
    </div>
  );
}
