import Image from "next/image";

export default function MonsterIcon({ imageName, name, tempered, size = 64, className = "" }) {
  const iconClass = `${tempered ? "tempered-monster-icon" : ""} pixel-art ${className}`;

  if (!imageName) {
    return (
      <div className={iconClass} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--mh-umber)', border: '1px solid var(--mh-border)' }}>
        <Image src="/icons/MHWilds-Hunt_Icon.png" width={size * 0.6} height={size * 0.6} alt="" className="pixel-art" />
      </div>
    );
  }

  return (
    <Image
      src={`/monsters/${imageName}`}
      alt={name || "Monster"}
      width={size}
      height={size}
      className={iconClass}
    />
  );
}
