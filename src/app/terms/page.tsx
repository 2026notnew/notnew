import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service — NotNew" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 17, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of
        notnew.com (the &ldquo;Service&rdquo;), operated by [NotNew, LLC]. By
        using the Service, you agree to these Terms.
      </p>

      <h2>Eligibility & accounts</h2>
      <p>
        You must be at least 18 years old to register. You are responsible for
        activity under your account and for keeping your credentials secure.
      </p>

      <h2>What NotNew is</h2>
      <p>
        NotNew is a curated discovery platform. During this phase, listings link
        to items hosted on third-party sites. We are not a party to, and are not
        responsible for, any transaction you enter into on a third-party site.
        We do not verify the accuracy of listings, the condition or authenticity
        of items, or the identity of sellers.
      </p>

      <h2>User content</h2>
      <ul>
        <li>
          You retain ownership of content you submit. You grant NotNew a
          worldwide, non-exclusive, royalty-free license to host, display, and
          distribute it on the Service.
        </li>
        <li>
          You represent that you have the rights to submit the content and that
          it does not infringe anyone&apos;s rights or violate any law.
        </li>
        <li>
          We may remove content, and suspend or terminate accounts, at our
          discretion — including content that violates our [Community
          Guidelines](/guidelines).
        </li>
      </ul>

      <h2>Prohibited conduct</h2>
      <ul>
        <li>Submitting spam, commodity items, or content that is not vintage/collectible.</li>
        <li>Posting unlawful, infringing, deceptive, or harassing content.</li>
        <li>Scraping, automated access, or interfering with the Service.</li>
        <li>Misrepresenting your identity or affiliation.</li>
      </ul>

      <h2>Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any
        kind. To the fullest extent permitted by law, NotNew disclaims all
        warranties, express or implied.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, NotNew will not be liable for
        indirect, incidental, or consequential damages, or for any transaction
        between you and a third party.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms. Continued use after changes take effect
        constitutes acceptance.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of [Nevada], without
        regard to conflict-of-laws principles.
      </p>

      <h2>Contact</h2>
      <p>[legal@notnew.com], [NotNew, LLC mailing address].</p>
    </LegalPage>
  );
}
