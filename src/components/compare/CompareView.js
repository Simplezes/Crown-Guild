"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shell/Icon";
import UserAvatar from "@/components/ui/UserAvatar";

function Avatar({ u, cls = "cmp-avatar" }) {
  if (!u) return <span className={`${cls} empty`}><Icon name="user" /></span>;
  return <UserAvatar src={u.avatar} alt={u.name} size={38} className={cls} />;
}

function Picker({ side, exclude, onPick, onClose }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      const p = new URLSearchParams({ limit: "12" });
      if (q.trim()) p.set("q", q.trim());
      if (exclude) p.set("exclude", exclude);
      fetch(`/api/wishlist/users?${p}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => alive && setUsers(d.users || []))
        .catch(() => alive && setUsers([]));
    }, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [q, exclude]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ovl">
      <div className="mback pb enter" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="pal cmp-picker" role="dialog" aria-modal="true" aria-label={`Select Hunter ${side}`}>
          <div className="hpkh"><b>Select Hunter {side}</b><button className="x2" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
          <label className="pin"><Icon name="search" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hunters" aria-label="Search hunters" autoComplete="off" /></label>
          <div className="plist">
            <div className="pg">Hunters</div>
            {users === null ? <div className="cmp-no-users">Loading…</div>
              : users.length === 0 ? <div className="cmp-no-users">No hunters match. Try another name.</div>
              : users.map((u) => (
                <button key={u.id} type="button" className="pi" onClick={() => onPick({ id: String(u.id), name: u.username, avatar: u.avatar_url || null })}>
                  <Avatar u={{ name: u.username, avatar: u.avatar_url }} cls="cmp-pick-avatar" />
                  <span className="cmp-pick-copy"><b>{u.username}</b><small>{u.crown_count} crowns &middot; {u.wishlist_count} wishlisted</small></span>
                  <Icon name="check" />
                </button>
              ))}
          </div>
          <div className="pfoot"><span>Choose a hunter to compare</span><span><kbd>Esc</kbd> close</span></div>
        </div>
      </div>
    </div>
  );
}

function Items({ items, empty }) {
  if (!items.length) return <div className="cmp-empty-list">{empty}</div>;
  return (
    <div className="cmp-items">
      {items.map((it) => (
        <Link key={it.id} className="cmp-item" href={`/monster/${encodeURIComponent(it.name)}`}>
          <div className="mi sm"><Image src={`/monsters/${it.image}`} alt="" width={30} height={30} unoptimized className="px" /></div>
          <b>{it.name}</b>
          <span className="cmp-crowns" title={`${it.type} crown${it.type === "both" ? "s" : ""}`}>
            {(it.type === "small" || it.type === "both") && <Image src="/icons/smallcrown.png" alt="Small" width={16} height={16} className="px" />}
            {(it.type === "large" || it.type === "both") && <Image src="/icons/largecrown.png" alt="Large" width={16} height={16} className="px" />}
          </span>
        </Link>
      ))}
    </div>
  );
}

const Stat = ({ v, label, primary }) => <div className={`cmp-stat ${primary ? "primary" : ""}`}><b>{v}</b><span title={label}>{label}</span></div>;

function ProfileCard({ u }) {
  return (
    <article className="cmp-profile">
      <div className="cmp-profile-top"><Avatar u={u} /><div><b>{u.name}</b><small>{u.rank} &middot; {u.mp} MP &middot; {u.completion}% collection</small></div></div>
      <div className="cmp-profile-stats">
        <div><b>{u.stats.total}</b><span>Crowns</span></div><div><b>{u.stats.small}</b><span>Small</span></div>
        <div><b>{u.stats.large}</b><span>Large</span></div><div><b>{u.stats.tempered}</b><span>Tempered</span></div>
      </div>
    </article>
  );
}

export default function CompareView({ a: initA, b: initB, result }) {
  const router = useRouter();
  const [a, setA] = useState(initA);
  const [b, setB] = useState(initB);
  const [picker, setPicker] = useState(null);

  const ready = a && b && a.id !== b.id;
  const run = () => ready && router.push(`/compare?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}`);
  const shown = result && initA?.stats && initB?.stats && initA.id === a?.id && initB.id === b?.id;

  const pick = (side, u) => (
    <div className="cmp-field">
      <label>Hunter {side.toUpperCase()}</label>
      <button type="button" className="cmp-pick" onClick={() => setPicker(side)} aria-haspopup="dialog" aria-expanded={picker === side}
        aria-label={`Choose Hunter ${side.toUpperCase()}${u ? `, current selection ${u.name}` : ""}`}>
        <Avatar u={u} />
        <span className="cmp-choice"><b>{u ? u.name : "Select hunter"}</b><small>{u ? (u.rank ? `${u.rank} · ${u.mp} MP` : "Selected") : "Search the guild registry"}</small></span>
        <Icon name="down" />
      </button>
    </div>
  );

  let body = (
    <section className="cmp-empty-state">
      <span className="cmp-empty-icon"><Icon name="compare" /></span>
      <div><b>{a && b ? "Ready to compare" : "Your comparison starts here"}</b>
        <p>{a && b ? "Run the comparison to see shared targets, unique crowns, and wishlist differences." : "Select two hunters above to reveal shared targets, crown species, and exclusive goals."}</p></div>
    </section>
  );

  if (shown) {
    const { shared, onlyA, onlyB, sharedSpecies, onlyOwnedA, onlyOwnedB } = result;
    const total = shared.length + onlyA.length + onlyB.length;
    const match = total ? Math.round((shared.length / total) * 100) : 0;
    const col = (u, items) => (
      <section className="cmp-section"><div className="cmp-section-head"><h3>{u.name} only</h3><span>{items.length} target{items.length === 1 ? "" : "s"}</span></div><Items items={items} empty="No exclusive targets." /></section>
    );
    body = (
      <div className="cmp-results">
        <div className="cmp-results-head"><div><h3>{initA.name} <em>vs</em> {initB.name}</h3><p className="sub">Comparison snapshot</p></div><span className="cmp-tag">Wishlist overlap {match}%</span></div>
        <div className="cmp-stats"><Stat v={shared.length} label="Shared targets" primary /><Stat v={onlyA.length} label={`${initA.name} only`} /><Stat v={onlyB.length} label={`${initB.name} only`} /><Stat v={`${match}%`} label="Match rate" /></div>
        <div className="cmp-profiles"><ProfileCard u={initA} /><ProfileCard u={initB} /></div>
        <div className="cmp-species"><Stat v={sharedSpecies} label="Shared crown species" primary /><Stat v={onlyOwnedA} label={`${initA.name} unique species`} /><Stat v={onlyOwnedB} label={`${initB.name} unique species`} /><Stat v={sharedSpecies + onlyOwnedA + onlyOwnedB} label="Combined species" /></div>
        <section className="cmp-section"><div className="cmp-section-head"><h3>Shared hunt board</h3><span>{shared.length} shared</span></div><Items items={shared} empty="No shared targets yet. Try another hunter pair." /></section>
        <div className="cmp-wishes">{col(initA, onlyA)}{col(initB, onlyB)}</div>
      </div>
    );
  }

  return (
    <div className="pad cmp-page">
      <header className="cmp-head"><div><h2>Compare hunters</h2><p>Find shared targets and see where each hunter&apos;s goals diverge.</p></div><span className="cmp-tag">Guild registry</span></header>
      <section className="cmp-pair">
        <div className="cmp-pair-head"><div><h3>Hunter pairing</h3><p>Choose any two hunters to compare their crowns and wishlists.</p></div><span className="cmp-pair-state">{a && b ? "Pair selected" : "Choose 2 hunters"}</span></div>
        <div className="cmp-selectors">
          {pick("a", a)}<span className="cmp-vs">VS</span>{pick("b", b)}
          <button type="button" className="btn cmp-run" onClick={run} disabled={!ready}><Icon name="compare" />Compare hunters</button>
        </div>
      </section>
      {body}
      {picker && <Picker side={picker.toUpperCase()} exclude={picker === "a" ? b?.id : a?.id} onClose={() => setPicker(null)} onPick={(u) => { (picker === "a" ? setA : setB)(u); setPicker(null); }} />}
    </div>
  );
}
