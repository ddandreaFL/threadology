import { Panel } from "@/components/panel/Panel";
import DevDetails from "@/app/dev/details/page";

export const dynamic = "force-dynamic";

export default function FlowItemPanel() {
  return (
    <Panel label="fit">
      <DevDetails searchParams={{ v: "fitvisitor" }} />
    </Panel>
  );
}
