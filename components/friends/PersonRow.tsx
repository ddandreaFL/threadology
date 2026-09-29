import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/profile/kit";
import type { Person } from "@/lib/friends";

/** A person, opening their profile; `trailing` replaces the chevron (request actions). */
export function PersonRow({ person, sub, trailing }: { person: Person; sub?: string; trailing?: ReactNode }) {
  return (
    <li className="flex min-h-16 items-center gap-3.5 border-b border-th-border py-3">
      <Link href={`/u/${person.username}`} className="flex min-w-0 flex-1 items-center gap-3.5 hover:opacity-80">
        <Avatar src={person.avatar_url} username={person.username} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-medium leading-[21px]">@{person.username}</span>
          {sub && <span suppressHydrationWarning className="block text-[13px] leading-[17px] text-th-muted">{sub}</span>}
        </span>
        {!trailing && <Icon name="chevron-right" size={16} className="shrink-0 text-th-muted" />}
      </Link>
      {trailing}
    </li>
  );
}
