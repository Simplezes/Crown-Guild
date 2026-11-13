import Image from "next/image";
import { SIZE_LABELS } from "@/config/sizes";
import { Icon } from "@/shared/ui";
import {
  FILTER_TITLES,
  type FilterField,
  type FilterOption,
  type FilterState,
} from "../lib/crown-filter";
import { applyFilterValue, filterCategories, filterMenuOptions } from "../lib/filter-options";

interface FilterMenuProps {
  filter: FilterState;
  onFilter: (update: (current: FilterState) => FilterState) => void;
  field: FilterField | null;
  onField: (field: FilterField | null) => void;
  monsters: FilterOption[];
  monsterTypes: string[];
  hasActive: boolean;
  onClearAll: () => void;
}

function LengthEditor({ filter, onFilter }: Pick<FilterMenuProps, "filter" | "onFilter">) {
  const setMode = (mode: "cm" | "size") =>
    onFilter((current) => ({ ...current, lengthMode: mode, lengthCm: "", lengthSize: "Any" }));

  return (
    <div className="pf-length-editor">
      <div className="pf-length-modes" role="group" aria-label="Length format">
        <button
          type="button"
          aria-pressed={filter.lengthMode === "cm"}
          onClick={() => setMode("cm")}
        >
          cm
        </button>
        <button
          type="button"
          aria-pressed={filter.lengthMode === "size"}
          onClick={() => setMode("size")}
        >
          Size
        </button>
      </div>
      {filter.lengthMode === "cm" ? (
        <label className="pf-length-input">
          <input
            type="number"
            min="0"
            step="any"
            value={filter.lengthCm}
            onChange={(event) =>
              onFilter((current) => ({ ...current, lengthCm: event.target.value }))
            }
            placeholder="Any length"
            aria-label="Length in centimeters"
          />
          <span>cm</span>
        </label>
      ) : (
        <div className="pf-filter-menu-options">
          {["Any", ...SIZE_LABELS].map((value) => (
            <button
              type="button"
              className="pf-filter-menu-option"
              key={value}
              aria-pressed={filter.lengthSize === value}
              onClick={() => onFilter((current) => ({ ...current, lengthSize: value }))}
            >
              <span>{value === "Any" ? "Any size" : value}</span>
              {filter.lengthSize === value && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterMenu(props: FilterMenuProps) {
  const { filter, onFilter, field, onField, monsters, monsterTypes } = props;

  return (
    <div className="pf-filter-menu" role="dialog" aria-label="Filter crowns">
      <div className="pf-filter-menu-head">
        {field && (
          <button
            type="button"
            className="pf-menu-back"
            onClick={() => onField(null)}
            aria-label="Back to filters"
          >
            <Icon name="back" />
          </button>
        )}
        <span>{field ? FILTER_TITLES[field] : "Add filter"}</span>
        {props.hasActive && (
          <button type="button" className="pf-filter-reset" onClick={props.onClearAll}>
            Clear all
          </button>
        )}
      </div>

      {!field ? (
        <div className="pf-filter-menu-options">
          {filterCategories(filter, monsters).map(({ key, value }) => (
            <button
              type="button"
              className="pf-filter-menu-row"
              key={key}
              onClick={() => onField(key)}
            >
              <span>{FILTER_TITLES[key]}</span>
              <small>{value}</small>
              <Icon name="down" className="pf-row-chevron" />
            </button>
          ))}
          <button
            type="button"
            className="pf-filter-menu-row"
            aria-pressed={filter.tempered}
            onClick={() => onFilter((current) => ({ ...current, tempered: !current.tempered }))}
          >
            <span>Tempered</span>
            <Icon name="check" className="pf-row-check" />
          </button>
        </div>
      ) : field === "length" ? (
        <LengthEditor filter={filter} onFilter={onFilter} />
      ) : (
        <div className="pf-filter-menu-options">
          {filterMenuOptions(field, monsters, monsterTypes).map(({ value, label, image_name }) => {
            const selected = filter[field] === value;
            return (
              <button
                type="button"
                className="pf-filter-menu-option"
                key={value}
                aria-pressed={selected}
                onClick={() => {
                  onFilter((current) => applyFilterValue(current, field, value));
                  onField(null);
                }}
              >
                <span>{label}</span>
                {field === "monsterId" && image_name ? (
                  <Image
                    src={`/monsters/${image_name}`}
                    alt=""
                    width={22}
                    height={22}
                    unoptimized
                    className="pf-monster-option-image"
                  />
                ) : (
                  selected && <Icon name="check" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
