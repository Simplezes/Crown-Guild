"use client";

import { Icon } from "./Icon";

interface PagerProps {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  compact?: boolean;
}

type PageItem = number | "…";

function pageItems(page: number, pages: number): PageItem[] {
  const items: PageItem[] = [];
  for (let n = 1; n <= pages; n++) {
    if (pages <= 6 || n === 1 || n === pages || Math.abs(n - page) <= 1) items.push(n);
    else if (items[items.length - 1] !== "…") items.push("…");
  }
  return items;
}

export function Pager({ page, pages, onPage, compact = false }: PagerProps) {
  if (pages <= 1) return null;

  const previous = (
    <button onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page">
      <Icon name="back" />
    </button>
  );
  const next = (
    <button onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Next page">
      <Icon name="back" className="fw" />
    </button>
  );

  if (compact) {
    return (
      <nav className="pager mini" aria-label="Pagination">
        {previous}
        <span>
          {page} / {pages}
        </span>
        {next}
      </nav>
    );
  }

  return (
    <nav className="pager" aria-label="Pagination">
      {previous}
      {pageItems(page, pages).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="gap">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPage(item)}
            aria-current={item === page ? "page" : undefined}
            className={item === page ? "on" : ""}
          >
            {item}
          </button>
        ),
      )}
      {next}
    </nav>
  );
}
