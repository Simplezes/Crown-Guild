import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/shared/ui";
import { buildPageHref, type SearchParams } from "../lib/pagination";

interface PaginationProps {
  page: number;
  totalPages: number;
  search: SearchParams;
  pageKey: string;
  activeTab: string;
}

export function Pagination({ page, totalPages, search, pageKey, activeTab }: PaginationProps) {
  if (totalPages <= 1) return null;
  const href = (target: number) => buildPageHref(search, { tab: activeTab, [pageKey]: target });

  return (
    <div className="pgn">
      <Link
        href={href(Math.max(1, page - 1))}
        className={page === 1 ? "off" : ""}
        aria-label="Previous page"
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        scroll={false}
      >
        <Icon name="back" />
      </Link>
      <span>
        Page {page} of {totalPages}
      </span>
      <Link
        href={href(Math.min(totalPages, page + 1))}
        className={page === totalPages ? "off" : ""}
        aria-label="Next page"
        aria-disabled={page === totalPages}
        tabIndex={page === totalPages ? -1 : undefined}
        scroll={false}
      >
        <Icon name="back" className="fw" />
      </Link>
    </div>
  );
}

interface SegmentProps {
  label: string;
  href: string;
  active: boolean;
  icon?: ReactNode;
}

export function Segment({ label, href, active, icon }: SegmentProps) {
  return (
    <Link
      href={href}
      scroll={false}
      className={active ? "on" : ""}
      aria-current={active ? "true" : undefined}
    >
      {icon}
      {label}
    </Link>
  );
}
