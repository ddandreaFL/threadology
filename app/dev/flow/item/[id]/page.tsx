import DevDetails from "@/app/dev/details/page";

export const dynamic = "force-dynamic";

/** The full page, as a direct load shows it. */
export default function FlowItem() {
  return (
    <div id="full-page">
      <DevDetails searchParams={{ v: "fitvisitor" }} />
    </div>
  );
}
