import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import avatarPlaceholder from "@assets/generated_images/User_avatar_placeholder_98ad4be5.png";

interface UserAvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ""}`} data-testid="avatar-user">
      <AvatarImage src={src || avatarPlaceholder} alt={name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;