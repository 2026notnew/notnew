import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Copyright & DMCA — NotNew" };

export default function DmcaPage() {
  return (
    <LegalPage title="Copyright & DMCA Policy" updated="June 17, 2026">
      <p>
        NotNew respects the intellectual property of others and responds to
        notices of alleged copyright infringement under the Digital Millennium
        Copyright Act (DMCA).
      </p>

      <h2>Reporting infringement</h2>
      <p>
        If you believe content on NotNew infringes your copyright, send a written
        notice to our Designated Agent (below) including:
      </p>
      <ul>
        <li>Your physical or electronic signature.</li>
        <li>Identification of the copyrighted work claimed to be infringed.</li>
        <li>
          Identification of the material claimed to be infringing and its
          location on the Service (e.g., the listing URL).
        </li>
        <li>Your contact information (address, phone, email).</li>
        <li>
          A statement that you have a good-faith belief the use is not authorized
          by the copyright owner, its agent, or the law.
        </li>
        <li>
          A statement, under penalty of perjury, that the information is accurate
          and that you are the owner or authorized to act on the owner&apos;s
          behalf.
        </li>
      </ul>

      <h2>Designated Copyright Agent</h2>
      <p>
        [Agent Name]
        <br />
        [NotNew, LLC]
        <br />
        [Mailing address]
        <br />
        [dmca@notnew.com]
      </p>

      <h2>Counter-notification</h2>
      <p>
        If your content was removed and you believe it was a mistake or
        misidentification, you may submit a counter-notification to the
        Designated Agent with the information required by 17 U.S.C. § 512(g).
      </p>

      <h2>Repeat infringers</h2>
      <p>
        We will terminate, in appropriate circumstances, the accounts of users
        who are repeat infringers.
      </p>

      <h2>About linked content</h2>
      <p>
        Many NotNew listings link to items hosted on third-party sites. For
        material hosted elsewhere, the host site&apos;s copyright process may
        also apply.
      </p>
    </LegalPage>
  );
}
