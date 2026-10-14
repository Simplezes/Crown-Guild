const NAMES = {
  home: "house", monsters: "paw-print", compare: "arrow-left-right", pin: "pin", user: "user",
  settings: "settings", chat: "message-circle", search: "search", plus: "plus", close: "x",
  down: "chevron-down", back: "arrow-left", open: "arrow-up-right", edit: "pencil", link: "link",
  trash: "trash-2", copy: "copy", check: "check", flag: "flag", grid: "layout-grid", rows: "list",
  event: "calendar", optional: "clipboard-list", survey: "map", investigation: "compass", tempered: "flame",
};

export function Icon({ name, className = "" }) {
  const id = NAMES[name] || name;
  if (id === "filter") {
    return (
      <svg className={`ms lu ${className}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "pin") {
    return (
      <>
        <svg className={`ms lu pin-o ${className}`} viewBox="0 0 24 24" aria-hidden="true"><use href="/sprite.svg#lu-pin-o" /></svg>
        <svg className={`ms lu pin-f ${className}`} viewBox="0 0 24 24" aria-hidden="true"><use href="/sprite.svg#lu-pin-f" /></svg>
      </>
    );
  }
  return (
    <svg className={`ms lu ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <use href={`/sprite.svg#lu-${id}`} />
    </svg>
  );
}

export function Emblem({ rank, className = "" }) {
  const n = Math.max(1, Math.min(8, rank || 1));
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={`Rank ${n}`}>
      <use href={`/sprite.svg#rk${n}`} />
    </svg>
  );
}
