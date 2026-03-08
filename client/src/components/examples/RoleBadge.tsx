import RoleBadge from '../RoleBadge';

export default function RoleBadgeExample() {
  return (
    <div className="p-4 space-y-2">
      <div className="flex gap-2 flex-wrap">
        <RoleBadge role="student" />
        <RoleBadge role="parent" />
        <RoleBadge role="teacher" />
        <RoleBadge role="admin" />
      </div>
    </div>
  );
}