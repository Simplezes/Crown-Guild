"use client";

import { useEffect, useRef, useState } from "react";
import {
  BOTTOM_SPACE,
  CARD_HEIGHT,
  CARD_WIDTH,
  GAP,
  HEAD_HEIGHT,
  MOBILE_BREAKPOINT,
  ROW_HEIGHT,
  type BoardView,
} from "../lib/board";

export function useBoardFit(view: BoardView) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(10);
  const [rows, setRows] = useState(0);

  useEffect(() => {
    const fit = () => {
      const element = bodyRef.current;
      if (!element) return;
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setRows(0);
        setSize(8);
        return;
      }
      const available =
        window.innerHeight - (element.getBoundingClientRect().top + window.scrollY) - BOTTOM_SPACE;
      if (view === "grid") {
        const columns = Math.max(1, Math.floor((element.clientWidth + GAP) / (CARD_WIDTH + GAP)));
        const fitRows = Math.max(1, Math.floor((available + GAP) / (CARD_HEIGHT + GAP)));
        setRows(fitRows);
        setSize(columns * fitRows);
      } else {
        const fitRows = Math.max(3, Math.floor((available - HEAD_HEIGHT) / ROW_HEIGHT));
        setRows(fitRows);
        setSize(fitRows);
      }
    };
    const frame = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, [view]);

  const minHeight = rows
    ? view === "grid"
      ? rows * (CARD_HEIGHT + GAP) - GAP
      : HEAD_HEIGHT + rows * ROW_HEIGHT
    : undefined;

  return { bodyRef, size, minHeight };
}
