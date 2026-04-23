interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

export function ProfileHeader({ username, avatarUrl, createdAt }: ProfileHeaderProps) {
  const initial = username[0].toUpperCase();
  const joinYear = new Date(createdAt).getFullYear();

  return (
    <div className="pt-7 text-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={username}
          className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#1A1A1A]">
          <span className="text-[28px] font-medium text-white">{initial}</span>
        </div>
      )}
      <h1 className="text-[18px] font-medium tracking-[-0.01em] text-[#111111] mb-[3px]">
        {username}
      </h1>
      <p className="text-[12px] text-[#999999]">collecting since {joinYear}</p>
    </div>
  );
}
