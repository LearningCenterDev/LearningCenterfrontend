import { Badge } from "@/components/ui/badge";
import { User, Users, GraduationCap, Shield } from "lucide-react";

type UserRole = "student" | "parent" | "teacher" | "admin";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig = {
  student: { icon: GraduationCap, label: "Student", variant: "secondary" as const },
  parent: { icon: Users, label: "Parent", variant: "outline" as const },
  teacher: { icon: User, label: "Teacher", variant: "default" as const },
  admin: { icon: Shield, label: "Admin", variant: "destructive" as const },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className} data-testid={`badge-role-${role}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export default RoleBadge;