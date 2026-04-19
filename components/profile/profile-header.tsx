interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  isPremium: boolean;
}

export function ProfileHeader({
  username,
  avatarUrl,
  createdAt,
  isPremium,
}: ProfileHeaderProps) {
  const initial = username[0].toUpperCase();
  const joinDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mb-8 text-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={username}
          className="mx-auto mb-4 h-20 w-20 rounded-full border border-[#E0D8CC] object-cover"
        />
      ) : (
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#E0D8CC] bg-[#2D5A45]/10">
          <span className="font-serif text-3xl text-[#2D5A45]">{initial}</span>
        </div>
      )}

      <h1 className="font-serif text-2xl text-gray-900">@{username}</h1>
      <p className="mt-1 font-mono-display text-xs text-gray-400">
        Joined {joinDate}
      </p>

      {isPremium && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <svg
            className="h-3 w-3 text-[#2D5A45]"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M6 0l1.5 4h4l-3.25 2.5 1.25 4L6 8.25 2.5 10.5l1.25-4L.5 4h4z" />
          </svg>
          <span className="font-mono-display text-[11px] uppercase tracking-widest text-[#2D5A45]">
            Premium
          </span>
        </div>
      )}
    </div>
  );
}
