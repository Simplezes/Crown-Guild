import Image from "next/image";

export default function MonsterIcon({ imageName, name, tempered, size = 64, className = "", loading }) {
  const iconClass = `${tempered ? "tempered-monster-icon" : ""} pixel-art ${className}`;

  if (!imageName) {
    return (
      <div className={`${iconClass} flex items-center justify-center rounded-lg border border-white/10 bg-void-raised`} style={{ width: size, height: size }}>
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
      loading={loading}
    />
  );
}
