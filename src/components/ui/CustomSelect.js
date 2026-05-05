"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./CustomSelect.module.css";

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

  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) inputRef.current.focus();
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 260;
        const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
        setDropdownStyle({
          position: "fixed",
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
          ...(openUpward
            ? { bottom: window.innerHeight - rect.top + 4, top: "auto" }
            : { top: rect.bottom + 4 }),
        });
      }
    } else {
      setSearchTerm("");
    }
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
    <div className={styles.optionsList} style={dropdownStyle} ref={dropdownRef}>
      <div className={styles.searchWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className={styles.optionsScroll}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => (
            <div
              key={option.value}
              className={`${styles.option} ${value === option.value ? styles.optionSelected : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))
        ) : (
          <div className={styles.noResults}>No results found</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.selectContainer} ref={containerRef}>
      <div
        className={`${styles.selectHeader} ${isOpen ? styles.selectHeaderOpen : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <div className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`} />
      </div>

      {typeof document !== "undefined" ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
