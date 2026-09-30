import { Panel } from "@/components/panel/Panel";
import { SharedFitView } from "@/components/shared/SharedFitView";

export const dynamic = "force-dynamic";

/** A shared fit opened from inside the app (saved, the inbox): in the slide-over. */
export default function InPanel(props: { params: { username: string; slug: string }; searchParams: { k?: string; preview?: string } }) {
  return (
    <Panel label="fit">
      <SharedFitView {...props} inPanel />
    </Panel>
  );
}
