import Image from "next/image";
import { HunterItem } from "@/features/hosts";
import { buildPageHref, type SearchParams } from "../lib/pagination";
import type { HostSection } from "../lib/host-sections";
import { Pagination, Segment } from "./PageNav";

interface HostsPanelProps {
  sections: HostSection[];
  search: SearchParams;
  crownType: string;
  hasPairs: boolean;
  monsterName: string;
  highlightId: string | undefined;
  viewerId: string | null;
}

export function HostsPanel({
  sections,
  search,
  crownType,
  hasPairs,
  monsterName,
  highlightId,
  viewerId,
}: HostsPanelProps) {
  const visible =
    crownType === "all" ? sections : sections.filter((section) => section.key === crownType);
  const href = (type: string) => buildPageHref(search, { crownType: type });

  return (
    <>
      <div
        className="seg lk type-filter"
        role="group"
        aria-label="Crown type"
        style={{ marginTop: 14 }}
      >
        <Segment label="All types" href={href("all")} active={crownType === "all"} />
        {hasPairs && <Segment label="Pairs" href={href("pairs")} active={crownType === "pairs"} />}
        <Segment
          label="Large"
          href={href("large")}
          active={crownType === "large"}
          icon={<Image src="/icons/largecrown.png" width={14} height={14} alt="" className="px" />}
        />
        <Segment
          label="Small"
          href={href("small")}
          active={crownType === "small"}
          icon={<Image src="/icons/smallcrown.png" width={14} height={14} alt="" className="px" />}
        />
      </div>

      {visible.map((section) => (
        <div key={section.key} className="hsec">
          <div className="hsh">
            <b>{section.title}</b>
            <span>{section.count}</span>
          </div>
          {section.groups.length > 0 ? (
            <div className="hostgrid">
              {section.groups.map(([crown, linked]) =>
                crown ? (
                  <HunterItem
                    key={crown.id}
                    viewerId={viewerId}
                    crown={crown}
                    linkedCrown={linked ?? null}
                    monsterName={monsterName}
                    isHighlighted={[crown, linked].some((c) => c && String(c.id) === highlightId)}
                  />
                ) : null,
              )}
            </div>
          ) : (
            <div className="m2empty">
              <b>{section.empty}</b>
            </div>
          )}
          <Pagination
            page={section.page}
            totalPages={section.totalPages}
            search={search}
            pageKey={section.pageKey}
            activeTab="hosts"
          />
        </div>
      ))}
    </>
  );
}
