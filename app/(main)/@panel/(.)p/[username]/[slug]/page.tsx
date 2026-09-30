import { Panel } from "@/components/panel/Panel";
import { SharedPieceView } from "@/components/shared/SharedPieceView";

export const dynamic = "force-dynamic";

/** A shared piece opened from inside the app (saved, the inbox): in the slide-over. */
export default function InPanel(props: { params: { username: string; slug: string }; searchParams: { k?: string; preview?: string } }) {
  return (
    <Panel label="piece">
      <SharedPieceView {...props} inPanel />
    </Panel>
  );
}
