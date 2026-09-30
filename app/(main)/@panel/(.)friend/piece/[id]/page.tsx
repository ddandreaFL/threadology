import { Panel } from "@/components/panel/Panel";
import Page from "@/app/(main)/friend/piece/[id]/page";

export const dynamic = "force-dynamic";

/** /friend/piece/[id], opened from inside the app: the same page, in the slide-over. */
export default function InPanel(props: { params: { id: string } }) {
  return (
    <Panel label="piece">
      <Page {...props} />
    </Panel>
  );
}
