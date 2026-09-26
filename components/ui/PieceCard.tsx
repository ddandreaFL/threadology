import Link from "next/link";

/**
 * A grid cell (the app's vault and collection grids): a square photo at the
 * card radius, the name, and the brand beneath.
 */
export function PieceCard({
  href,
  photo,
  title,
  subtitle,
  aspect = "square",
}: {
  href?: string;
  photo: string | null;
  title: string;
  subtitle?: string | null;
  aspect?: "square" | "portrait";
}) {
  const body = (
    <>
      <div className={`overflow-hidden rounded-2xl bg-th-chip ${aspect === "square" ? "aspect-square" : "aspect-[4/5]"}`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-[#CCCCCC]">✦</div>
        )}
      </div>
      <p className="mt-2 truncate text-[13px] font-medium text-th-ink">{title}</p>
      {subtitle ? <p className="mt-0.5 truncate text-[11px] text-th-muted">{subtitle}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="group block font-th-sans">
      {body}
    </Link>
  ) : (
    <div className="group font-th-sans">{body}</div>
  );
}
