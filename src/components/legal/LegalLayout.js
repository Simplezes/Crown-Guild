import Link from "next/link";

export default function LegalLayout({ title, intro, children }) {
  return (
    <article className="legal-page">
      <header className="legal-header">
        <Link className="legal-home" href="/">Crown Guild</Link>
        <nav className="legal-nav" aria-label="Legal pages">
          <Link href="/terms" aria-current={title === "Terms of Service" ? "page" : undefined}>Terms</Link>
          <Link href="/privacy" aria-current={title === "Privacy Policy" ? "page" : undefined}>Privacy</Link>
        </nav>
      </header>
      <div className="legal-body">
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <p className="legal-updated">Last updated: October 7, 2026</p>
        <div className="legal-content">{children}</div>
      </div>
      <footer className="legal-footer">
        Questions? <a href="mailto:thehunterloki@gmail.com">thehunterloki@gmail.com</a> or Discord: <a href="https://discord.com/users/429539479850844160" target="_blank" rel="noopener noreferrer">Simplezes</a> (user ID: 429539479850844160).
      </footer>
    </article>
  );
}