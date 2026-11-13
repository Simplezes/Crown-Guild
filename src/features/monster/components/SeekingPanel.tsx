import Image from "next/image";
import Link from "next/link";
import type { SeekingEntry } from "@/server/services/monster-page";
import { UserAvatar } from "@/shared/ui";
import { paginateItems, type SearchParams } from "../lib/pagination";
import { Pagination } from "./PageNav";

interface SeekingPanelProps {
  wishlist: SeekingEntry[];
  page: number;
  search: SearchParams;
}

export function SeekingPanel({ wishlist, page, search }: SeekingPanelProps) {
  const paged = paginateItems(wishlist, page);

  return (
    <>
      <div className="list" style={{ marginTop: 14 }}>
        {wishlist.length > 0 ? (
          paged.items.map((entry) => (
            <Link className="r" href={`/profile/${entry.user_id}`} key={entry.id || entry.user_id}>
              <UserAvatar
                src={entry.avatar_url}
                alt={entry.username ?? ""}
                size={44}
                className="av"
              />
              <div>
                <div className="n">{entry.username}</div>
                <div className="s">{entry.status_message || "Active hunter"}</div>
              </div>
              <span className="x">
                {(entry.type === "small" || entry.type === "both") && (
                  <Image
                    src="/icons/smallcrown.png"
                    width={18}
                    height={18}
                    alt="Small"
                    className="px"
                  />
                )}
                {(entry.type === "large" || entry.type === "both") && (
                  <Image
                    src="/icons/largecrown.png"
                    width={18}
                    height={18}
                    alt="Large"
                    className="px"
                  />
                )}
              </span>
            </Link>
          ))
        ) : (
          <div className="m2empty">
            <b>No hunters are tracking this monster</b>
            <span>Track it to be the first.</span>
          </div>
        )}
      </div>
      <Pagination
        page={paged.page}
        totalPages={paged.totalPages}
        search={search}
        pageKey="seekingPage"
        activeTab="seeking"
      />
    </>
  );
}
