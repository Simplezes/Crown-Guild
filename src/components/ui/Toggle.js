"use client";

export default function Toggle({ checked, onChange, labelOn = "On", labelOff = "Off", labelClassName = "" }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-void-raised transition-colors peer-checked:bg-ember peer-checked:[&>span]:translate-x-5 peer-checked:[&>span]:bg-void">
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-mist-dim transition-transform" />
      </span>
      
      <span className={`font-body text-xs uppercase tracking-wider text-mist-dim ${labelClassName}`}>
        {checked ? labelOn : labelOff}
      </span>
    </label>
  );
}
