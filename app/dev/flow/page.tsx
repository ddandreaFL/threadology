import Link from "next/link";

export const dynamic = "force-dynamic";

export default function FlowList() {
  return (
    <div className="th-page py-6">
      <h1 className="text-[28px] font-bold">list</h1>
      {Array.from({ length: 40 }, (_, i) => (
        <Link key={i} id={`item-${i}`} href={`/dev/flow/item/${i}`} className="block border-b border-th-border py-4">
          fit {i}
        </Link>
      ))}
    </div>
  );
}
