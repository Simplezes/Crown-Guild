"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import UnifiedQuestModal from "../crowns/UnifiedQuestModal";
import BeaconCenter from "../beacon/BeaconCenter";
import styles from "./Nav.module.css";
import { SOS_FEATURE_ENABLED } from "@/lib/sos";

export default function Nav() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = () => setIsMenuOpen(false);
  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoMark}>
          <Image
            src="/icon.png"
            alt="Crown Guild"
            width={40}
            height={40}
            className={"pixel-art " + styles.logoImage}
          />
        </span>
        <span className={styles.logoText}>
          <span className={styles.logoTitle}>Crown Guild</span>
        </span>
      </Link>

      <button
        className={styles.menuToggle}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? (
          <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="" className="pixel-art" />
        ) : (
          <Image src="/icons/MHWilds-Quest_Menu_Icon.png" width={24} height={24} alt="" className="pixel-art" />
        )}
      </button>

      <ul className={`${styles.navLinks} ${isMenuOpen ? styles.mobileActive : ""}`}>
        <li>
          <Link href="/" className="nav-link" onClick={handleNavClick}>
            Hub
          </Link>
        </li>
        <li>
          <Link href="/registry" className="nav-link" onClick={handleNavClick}>
            Crowns
          </Link>
        </li>
        <li>
          <Link href="/investigation" className="nav-link" onClick={handleNavClick}>
            Monsters
          </Link>
        </li>
        {SOS_FEATURE_ENABLED && (
          <li>
            <Link href="/missions" className="nav-link" onClick={handleNavClick}>
              Missions
            </Link>
          </li>
        )}
        <li>
          <Link href="/compare" className="nav-link" onClick={handleNavClick}>
            Compare
          </Link>
        </li>
      </ul>

      <div className={styles.authSection}>
        {session && (
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsMenuOpen(false);
            }}
            className={styles.createBtn}
          >
            Create Crown
          </button>
        )}

        {session ? (
          <div className={styles.userProfile} ref={dropdownRef}>
            <BeaconCenter />
            <button
              className={styles.userInfo}
              onClick={handleDropdownToggle}
              aria-label="User menu"
            >
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name}
                  width={28}
                  height={28}
                  className={"pixel-art " + styles.userAvatar}
                />
              )}
              <span className={styles.userName}>{session.user.name}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginLeft: "4px" }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className={styles.dropdown}>
                <Link
                  href={`/profile/${session.user.id}`}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  Profile
                </Link>
                <Link
                  href={`/profile/${session.user.id}?settings=true`}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className={`${styles.dropdownItem} ${styles.dropdownSignOut}`}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn("discord")}
            className="mh-button"
            style={{ padding: "8px 20px", fontSize: "0.75rem" }}
          >
            Sign In
          </button>
        )}
      </div>

      <UnifiedQuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdated={() => {
          router.refresh();
        }}
      />
    </nav>
  );
}
