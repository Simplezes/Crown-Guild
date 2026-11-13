import { Icon, UserAvatar } from "@/shared/ui";

interface HunterAvatarProps {
  hunter: { name: string; avatar: string | null } | null;
  className?: string;
}

export function HunterAvatar({ hunter, className = "cmp-avatar" }: HunterAvatarProps) {
  if (!hunter) {
    return (
      <span className={`${className} empty`}>
        <Icon name="user" />
      </span>
    );
  }
  return <UserAvatar src={hunter.avatar} alt={hunter.name} size={38} className={className} />;
}
