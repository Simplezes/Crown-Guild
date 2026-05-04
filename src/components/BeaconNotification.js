'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import styles from './BeaconNotification.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function BeaconNotification() {
  const { data: session } = useSession();
  const [beacons, setBeacons] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      newSocket.emit('register', session.user.id);
    });

    newSocket.on('beacon', (data) => {
      setBeacons((prev) => [...prev, { ...data, id: Date.now() }]);
      const audio = new Audio('/sounds/MHWilds-Ping.mp3');
      audio.play().catch(() => { });
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [session]);

  const removeBeacon = (id) => {
    setBeacons((prev) => prev.filter((b) => b.id !== id));
  };

  if (beacons.length === 0) return null;

  return (
    <div className={styles.container}>
      {beacons.map((beacon) => (
        <div key={beacon.id} className={styles.beaconBar + " animate-mh-slide-down"}>
          <div className={styles.content}>
            <div className={styles.icon}>
              <Image src="/icons/MHWilds-Link_Party_Icon.png" width={24} height={24} alt="" className="pixel-art" />
            </div>
            <div className={styles.text}>
              <span className={styles.highlight}>{beacon.requester_name}</span> fired an SOS Flare for your 
              <span className={styles.target}>
                {beacon.monster_image && (
                  <Image 
                    src={`/monsters/${beacon.monster_image}`} 
                    width={20} 
                    height={20} 
                    alt="" 
                    className="pixel-art" 
                    style={{ verticalAlign: 'middle', margin: '0 4px' }}
                  />
                )}
                {beacon.monster_name}
              </span>
            </div>
            <div className={styles.actions}>
              <Link
                href={`/monster/${beacon.monster_name}`}
                className={styles.viewBtn}
                onClick={() => removeBeacon(beacon.id)}
              >
                View Hunt
              </Link>
              <button className={styles.closeBtn} onClick={() => removeBeacon(beacon.id)}>
                Dismiss
              </button>
            </div>
          </div>
          <div className={styles.timer}></div>
        </div>
      ))}
    </div>
  );
}
