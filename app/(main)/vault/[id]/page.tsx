import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

interface PiecePageProps {
  params: { id: string };
}

export default async function PiecePage({ params }: PiecePageProps) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data: piece } = await supabase
    .from("pieces")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!piece) notFound();

  const title = piece.name ?? piece.type;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/vault" className="hover:text-gray-700 transition-colors">
          Vault
        </Link>
        <span>/</span>
        <span className="text-gray-700">{title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Photos */}
        <div className="flex flex-col gap-3">
          {piece.photos.length > 0 ? (
            <>
              {/* Primary photo */}
              <div className="aspect-square overflow-hidden rounded-2xl border border-[#E0D8CC] bg-[#F5F1EA]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={piece.photos[0]}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Additional photos */}
              {piece.photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {piece.photos.slice(1).map((url, i) => (
                    <div
                      key={i}
                      className="aspect-square overflow-hidden rounded-lg border border-[#E0D8CC] bg-[#F5F1EA]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${title} ${i + 2}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#F5F1EA]">
              <p className="text-sm text-gray-400">No photos</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="font-mono-display text-xs uppercase tracking-widest text-gray-400">
            {piece.brand}
          </p>
          <h1 className="mt-1 font-serif text-3xl capitalize text-gray-900">
            {title}
          </h1>

          {/* Meta grid */}
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#E0D8CC] pt-6">
            {[
              { label: "Type", value: piece.type },
              { label: "Year", value: piece.year },
              { label: "Season", value: piece.season },
              { label: "Size", value: piece.size },
              { label: "Condition", value: piece.condition },
            ]
              .filter((f) => f.value)
              .map((f) => (
                <div key={f.label}>
                  <dt className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
                    {f.label}
                  </dt>
                  <dd className="mt-0.5 text-sm capitalize text-gray-700">
                    {f.value}
                  </dd>
                </div>
              ))}
          </dl>

          {/* Story */}
          {piece.story && (
            <div className="mt-6 border-t border-[#E0D8CC] pt-6">
              <p className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
                Story
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {piece.story}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-3 border-t border-[#E0D8CC] pt-6">
            <Link
              href="/vault"
              className="rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-[#F5F1EA]"
            >
              ← Back to vault
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
