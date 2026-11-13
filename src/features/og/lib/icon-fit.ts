interface IconFitOptions {
  groups: number[];
  candidates: number[];
  gap: number;
  groupGap: number;
  headerHeight: number;
  width: number;
  height: number;
  fallback: number;
}

export function pickIconSize(options: IconFitOptions): number {
  const groups = options.groups.filter((count) => count > 0);
  const fits = (size: number) => {
    const perRow = Math.floor(options.width / (size + options.gap));
    if (perRow === 0) return false;
    let used = 0;
    groups.forEach((count, index) => {
      if (index > 0) used += options.groupGap;
      used += options.headerHeight + Math.ceil(count / perRow) * (size + options.gap);
    });
    return used <= options.height;
  };
  return options.candidates.find(fits) ?? options.fallback;
}
