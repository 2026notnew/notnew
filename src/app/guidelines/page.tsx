import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Community Guidelines — NotNew" };

export default function GuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines" updated="June 17, 2026">
      <p>
        NotNew is a curated home for vintage and collectible items worth stopping
        for. These guidelines keep it that way.
      </p>

      <h2>What belongs here</h2>
      <ul>
        <li>Vintage, antique, or genuinely collectible items, $100 and up.</li>
        <li>
          Things a knowledgeable collector would look twice at — not commodities.
        </li>
        <li>Accurate titles, honest descriptions, and real photos.</li>
      </ul>

      <h2>What doesn&apos;t</h2>
      <ul>
        <li>
          New, mass-market, or commodity goods (phone chargers, current-gen
          electronics, generic merchandise).
        </li>
        <li>Spam, self-promotion, affiliate dumping, or duplicate listings.</li>
        <li>Counterfeits, replicas misrepresented as originals, or stolen goods.</li>
        <li>Illegal items or anything prohibited by law.</li>
        <li>Harassment, hate speech, or personal attacks in comments.</li>
      </ul>

      <h2>How curation works</h2>
      <p>
        Submissions are reviewed before they appear. The community votes finds up
        and down, and anyone can flag a listing that doesn&apos;t belong. Our
        moderators have the final say, and we may remove anything that falls
        short of the bar.
      </p>

      <h2>Flagging</h2>
      <p>
        See something off? Use the &ldquo;Flag this listing&rdquo; link on any
        find. Flags are confidential and help us keep the quality high.
      </p>

      <p>
        Repeated or serious violations can lead to removal of content and
        suspension of your account, as described in our{" "}
        <a href="/terms">Terms of Service</a>.
      </p>
    </LegalPage>
  );
}
