import Image from "next/image";
import type { SharedFitData } from "@/lib/shared";

/**
 * The body of a shared fit, shared by the page and by the view that appears
 * once a password challenge is answered, so the two cannot drift.
 */
export function SharedFitBody({ data }: { data: SharedFitData }) {
  const { owner, fit, pieces } = data;
  const hero = fit.photos?.[0];
  const dateLabel = fit.date
    ? new Date(fit.date).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="pb-24">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#111111]">
        {hero && (
          <Image
            src={hero}
            alt={fit.title ?? "fit"}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
            priority
          />
        )}
      </div>

      <header className="pt-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#2D5A45]">
          @{owner.username}
        </p>
        <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.02em] text-[#1B1A17]">
          {fit.title ?? "untitled fit"}
        </h1>
        {dateLabel && <p className="mt-1.5 text-[14px] text-[#6B6358]">{dateLabel}</p>}
      </header>

      {pieces.length > 0 && (
        <section className="mt-9">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6358]">
            pieces
          </h2>
          <ul className="mt-3">
            {pieces.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 border-b border-[#F0F0F0] py-3"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#F2F0EC]">
                  {p.photos?.[0] && (
                    <Image src={p.photos[0]} alt="" fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-[#1B1A17]">{p.name ?? p.type}</p>
                  <p className="truncate text-[12px] text-[#6B6358]">
                    {[p.brand, p.year, p.size].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fit.caption && (
        <section className="mt-9 border-l-2 border-[#2D5A45] pl-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2D5A45]">
            caption
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[1.7] text-[#1B1A17]">
            {fit.caption}
          </p>
        </section>
      )}
    </article>
  );
}
