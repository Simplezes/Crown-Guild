import { Icon } from "@/shared/ui";
import { FILTERS, SORTS, type BoardFilter, type BoardSort, type BoardView } from "../lib/board";

interface BoardToolbarProps {
  query: string;
  onQuery: (query: string) => void;
  filter: BoardFilter;
  onFilter: (filter: BoardFilter) => void;
  counts: Record<BoardFilter, number>;
  sort: BoardSort;
  onSort: (sort: BoardSort) => void;
  view: BoardView;
  onView: (view: BoardView) => void;
}

export function BoardToolbar(props: BoardToolbarProps) {
  const { query, filter, sort, view } = props;

  return (
    <div className="m2b">
      <label className="search">
        <Icon name="search" />
        <input
          type="search"
          value={query}
          onChange={(event) => props.onQuery(event.target.value)}
          placeholder="Search monsters"
          aria-label="Search monsters"
        />
        {query && (
          <button className="x" onClick={() => props.onQuery("")} aria-label="Clear">
            <Icon name="close" />
          </button>
        )}
      </label>
      <div className="m2ch" role="group" aria-label="Filter">
        {FILTERS.map((name) => (
          <button key={name} aria-pressed={filter === name} onClick={() => props.onFilter(name)}>
            {name}
            <i>{props.counts[name]}</i>
          </button>
        ))}
      </div>
      <span className="sp" />
      <div className="m2so">
        <span>Sort</span>
        <details
          className="m2sort"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              event.currentTarget.open = false;
          }}
        >
          <summary className="m2sort-trigger" aria-label={`Sort monsters by ${sort}`}>
            <span>{sort}</span>
            <Icon name="down" />
          </summary>
          <div className="m2sort-menu" role="group" aria-label="Sort options">
            {(Object.keys(SORTS) as BoardSort[]).map((key) => (
              <button
                key={key}
                type="button"
                className="m2sort-option"
                aria-pressed={sort === key}
                onClick={(event) => {
                  props.onSort(key);
                  const details = event.currentTarget.closest("details");
                  if (details) details.open = false;
                }}
              >
                <span>{key}</span>
                {sort === key && <Icon name="check" />}
              </button>
            ))}
          </div>
        </details>
      </div>
      <div className="vt" role="group" aria-label="View">
        <button
          aria-pressed={view === "grid"}
          onClick={() => props.onView("grid")}
          aria-label="Card view"
        >
          <Icon name="grid" />
        </button>
        <button
          aria-pressed={view === "table"}
          onClick={() => props.onView("table")}
          aria-label="Table view"
        >
          <Icon name="rows" />
        </button>
      </div>
    </div>
  );
}
