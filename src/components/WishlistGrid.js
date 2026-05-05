"use client";

import styles from './WishlistGrid.module.css';
import Image from 'next/image';
import Link from 'next/link';
import WishlistToggle from './WishlistToggle';

export default function WishlistGrid({ wishlist, isOwner, userId }) {
  if (!wishlist || wishlist.length === 0) return (
    <div className={styles.empty}>
      <p>Your wishlist is empty.</p>
      {isOwner && <Link href="/investigation" className={styles.cta}>Click here to add monsters</Link>}
    </div>
  );

  return (
    <div className={styles.grid}>
      {wishlist.map((item) => {
        return (
          <div key={item.monster_id} className={styles.item}>
            <Link 
              href={`/monster/${encodeURIComponent(item.monster_name)}?tab=seeking&user=${userId}`}
              className={styles.monsterLink}
            >
              <div className={styles.monsterIcon}>
                <Image
                  src={`/monsters/${item.image_name}`}
                  alt={item.monster_name}
                  width={32}
                  height={32}
                  className="pixel-art"
                />
              </div>

              <div className={styles.info}>
                <span className={styles.name}>{item.monster_name}</span>
                <div className={styles.types}>
                  {(item.type === 'small' || item.type === 'both') && (
                    <Image src="/icons/smallcrown.png" width={10} height={10} alt="S" className="pixel-art" />
                  )}
                  {(item.type === 'large' || item.type === 'both') && (
                    <Image src="/icons/largecrown.png" width={10} height={10} alt="L" className="pixel-art" />
                  )}
                </div>
              </div>
            </Link>

            {isOwner && (
              <div className={styles.actions}>
                <WishlistToggle
                  monsterId={item.monster_id}
                  initialType={item.type}
                  className={styles.compactToggle}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}