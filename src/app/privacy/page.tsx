import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy — NotNew" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 17, 2026">
      <p>
        This Privacy Policy explains how [NotNew, LLC] (&ldquo;NotNew,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects, uses, and shares
        information when you use notnew.com (the &ldquo;Service&rdquo;).
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> When you register, our
          authentication provider (Clerk) collects your email address and, if
          you choose social sign-in, basic profile information from that
          provider. We store a username and your role on the Service.
        </li>
        <li>
          <strong>Content you submit.</strong> Links, descriptions, images,
          comments, votes, and flags you contribute.
        </li>
        <li>
          <strong>Usage data.</strong> Standard log data such as IP address,
          browser type, and pages viewed, used to operate and secure the
          Service.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To operate, maintain, and improve the Service.</li>
        <li>To display the content you submit and attribute it to you.</li>
        <li>To moderate content and enforce our policies.</li>
        <li>To send service-related and, with your consent, newsletter email.</li>
      </ul>

      <h2>Service providers</h2>
      <p>
        We share information with vendors who process it on our behalf,
        including Clerk (authentication), Amazon Web Services (hosting and image
        storage), and our email provider. These providers are bound to use the
        information only to provide their services to us.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You may update or delete your account at any time.</li>
        <li>You may unsubscribe from newsletter email via the link in any message.</li>
        <li>
          Depending on where you live, you may have rights to access, correct,
          or delete your personal information. Contact us at [privacy@notnew.com]
          to exercise them.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use cookies that are strictly necessary to keep you signed in and to
        operate the Service. We do not use advertising cookies.
      </p>

      <h2>Children</h2>
      <p>
        The Service is not directed to children under 13, and we do not
        knowingly collect personal information from them.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: [privacy@notnew.com], [NotNew, LLC mailing
        address].
      </p>
    </LegalPage>
  );
}
