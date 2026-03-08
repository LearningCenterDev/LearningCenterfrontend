import UserAvatar from '../UserAvatar';

export default function UserAvatarExample() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <UserAvatar name="John Doe" size="sm" />
        <UserAvatar name="Jane Smith" size="md" />
        <UserAvatar name="Mike Johnson" size="lg" />
      </div>
    </div>
  );
}