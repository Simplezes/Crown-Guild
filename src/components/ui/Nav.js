"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import AddCrownModal from "../crowns/AddCrownModal";
import BeaconCenter from "../beacon/BeaconCenter";
import styles from "./Nav.module.css";

export default function Nav() {
  const { data: session } = useSession();
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

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/icon.png"
          alt="Logo"
          width={40}
          height={40}
          className={"pixel-art " + styles.logoImage}
        />
        <span className={styles.logoText}>Crown Guild</span>
      </Link>

      <button
        className={styles.menuToggle}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? (
          <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
        ) : (
          <Image src="/icons/MHWilds-Quest_Menu_Icon.png" width={24} height={24} alt="Menu" className="pixel-art" />
        )}
      </button>

      <div className={`${styles.navLinks} ${isMenuOpen ? styles.mobileActive : ""}`}>
        <Link href="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Hub</Link>
        <Link href="/registry" className="nav-link" onClick={() => setIsMenuOpen(false)}>Global List</Link>
        <Link href="/investigation" className="nav-link" onClick={() => setIsMenuOpen(false)}>Monsters</Link>
        <Link href="/missions" className="nav-link" onClick={() => setIsMenuOpen(false)}>Missions</Link>

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

        <div className={styles.authSection}>
          {session ? (
            <div className={styles.userProfile} ref={dropdownRef}>
              <BeaconCenter />
              <button
                className={styles.userInfo}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {session.user.image && (
                  <img src={session.user.image} alt="" className={"pixel-art " + styles.userAvatar} />
                )}
                <span className={styles.userName}>
                  {session.user.name}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className={styles.dropdown}>
                  <Link
                    href={`/profile/${session.user.id}`}
                    className={styles.dropdownItem}
                    onClick={() => { setIsDropdownOpen(false); setIsMenuOpen(false); }}
                  >
                    Profile
                  </Link>
                  <Link
                    href={`/settings`}
                    className={styles.dropdownItem}
                    onClick={() => { setIsDropdownOpen(false); setIsMenuOpen(false); }}
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
              style={{ padding: '8px 20px', fontSize: '0.75rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <AddCrownModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </nav>
  );
}
