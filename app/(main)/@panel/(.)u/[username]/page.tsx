import { Panel } from "@/components/panel/Panel";
import Page from "@/app/(main)/u/[username]/page";

export const dynamic = "force-dynamic";

/** /u/[username], opened from inside the app: the same page, in the slide-over. */
export default function InPanel(props: { params: { username: string } }) {
  return (
    <Panel label="profile">
      <Page {...props} />
    </Panel>
  );
}
