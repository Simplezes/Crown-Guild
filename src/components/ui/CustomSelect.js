"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function CustomSelect({ options, value, onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcPosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vp = window.visualViewport || { height: window.innerHeight, width: window.innerWidth };
    const vpHeight = vp.height;
    const dropdownHeight = 260;
    const spaceBelow = vpHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: vpHeight - rect.top + 4, top: "auto" }
        : { top: rect.bottom + 4 }),
    });
  };

  useEffect(() => {
    if (isOpen) {
      calcPosition();

      const vp = window.visualViewport;
      if (vp) {
        vp.addEventListener("resize", calcPosition);
        vp.addEventListener("scroll", calcPosition);
      }
      window.addEventListener("scroll", calcPosition, true);

      const isTouchDevice = window.matchMedia("(hover: none)").matches;
      if (!isTouchDevice && inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      setSearchTerm("");
    }

    return () => {
      const vp = window.visualViewport;
      if (vp) {
        vp.removeEventListener("resize", calcPosition);
        vp.removeEventListener("scroll", calcPosition);
      }
      window.removeEventListener("scroll", calcPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inContainer = containerRef.current && containerRef.current.contains(event.target);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      if (!inContainer && !inDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdown = isOpen && (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="flex max-h-[260px] flex-col overflow-hidden rounded-lg border border-white/10 bg-void-raised shadow-lift"
    >
      <div className="border-b border-white/5 p-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded-md bg-void px-3 py-1.5 font-body text-sm text-mist outline-none placeholder:text-mist-faint"
        />
      </div>
      <div className="overflow-y-auto py-1">
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => (
            <div
              key={option.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`cursor-pointer px-3 py-2 font-body text-sm transition-colors hover:bg-white/5 ${
                value === option.value ? "text-ember-bright" : "text-mist"
              }`}
            >
              {option.label}
            </div>
          ))
        ) : (
          <div className="px-3 py-4 text-center font-body text-sm text-mist-dim">No results found</div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 font-body text-sm transition-colors ${
          isOpen ? "border-ember/50 text-mist" : "border-white/10 text-mist hover:border-white/20"
        }`}
      >
        <span className={`truncate ${selectedOption ? "text-mist" : "text-mist-faint"}`}>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-mist-dim transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {typeof document !== "undefined" ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
