"use client";

import { Icon } from "@/components/shell/Icon";

export default function Pager({ page, pages, onPage, compact = false }) {
  if (pages <= 1) return null;
  if (compact) {
    return (
      <nav className="pager mini" aria-label="Pagination">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page"><Icon name="back" /></button>
        <span>{page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Next page"><Icon name="back" className="fw" /></button>
      </nav>
    );
  }
  const nums = [];
  for (let n = 1; n <= pages; n++) {
    if (pages <= 6 || n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <nav className="pager" aria-label="Pagination">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page"><Icon name="back" /></button>
      {nums.map((n, i) =>
        n === "…" ? <span key={`e${i}`} className="gap">…</span> : (
          <button key={n} onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined} className={n === page ? "on" : ""}>{n}</button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Next page"><Icon name="back" className="fw" /></button>
    </nav>
  );
}
