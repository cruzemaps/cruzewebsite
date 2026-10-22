import SEO from "@/components/SEO";
import LegalLayout from "@/components/legal/LegalLayout";
import { legalTokens as t } from "@/components/legal/legalTokens";
import {
  CompanyBlock,
  Eyebrow,
  H2,
  LEGAL_LAST_UPDATED,
  LI,
  Mail,
  P,
  RelatedLinks,
  Title,
  UL,
  Updated,
} from "@/components/legal/legalUi";

/**
 * Accessibility Statement. States the standard we aim for (WCAG 2.1 AA), what we
 * have done, known limits, and how to report a barrier. Honest about being a
 * work in progress rather than claiming full conformance.
 */
export default function Accessibility() {
  return (
    <LegalLayout>
      <SEO
        title="Accessibility Statement | Cruze"
        description="Cruze's commitment to an accessible website, the WCAG 2.1 AA standard we work toward, known limitations, and how to report an accessibility barrier."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Accessibility</Eyebrow>
        <Title>Accessibility Statement</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <P>
          Cruze wants everyone to be able to use cruzemaps.com, including people who use screen readers,
          keyboard navigation, magnification, or other assistive technology. We treat accessibility as
          part of building the site, not an afterthought.
        </P>

        <H2>The standard we aim for</H2>
        <P>
          We work toward the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA as our target.
          We also try to follow the spirit of the Americans with Disabilities Act (ADA) for web content.
          We are candid that the site is a work in progress and we do not claim full conformance today.
        </P>

        <H2>What we have done</H2>
        <UL>
          <LI>Semantic headings and landmarks so assistive technology can navigate the page structure.</LI>
          <LI>A visible keyboard focus indicator on interactive elements such as forms and buttons.</LI>
          <LI>Text and interface colors chosen against the dark theme for readable contrast.</LI>
          <LI>Alternative text or decorative-image handling on meaningful and decorative images.</LI>
          <LI>Labels tied to form fields on the pilot application and contact forms.</LI>
          <LI>A no-JavaScript fallback message that points to key pages.</LI>
        </UL>

        <H2>Known limitations</H2>
        <P>
          We are actively improving these areas. If one of them blocks you, tell us and we will help you
          get what you need another way.
        </P>
        <UL>
          <LI>
            Some animated and interactive visualizations (the traffic simulation, maps, and the lab
            views) are primarily visual and may not fully convey their meaning to assistive technology.
          </LI>
          <LI>
            Embedded third-party content, such as the scheduling widget on the investor page, is
            governed by that provider's own accessibility.
          </LI>
          <LI>
            Live camera and video content may lack captions or text alternatives.
          </LI>
        </UL>

        <H2>Report a barrier</H2>
        <P>
          If you hit an accessibility barrier, or you need information on this site in a different format,
          email <Mail addr="support@cruzemaps.com" />. Please include the page address (URL), what you
          were trying to do, and the assistive technology or browser you were using, so we can find and
          fix the barrier. We aim to reply within a few business days and to offer the information you
          needed by another means while we work on a fix.
        </P>

        <H2>Ongoing work</H2>
        <P>
          We test with keyboard navigation and automated checks as part of our build, and we fold
          accessibility fixes into regular releases. We will update this statement as the site changes.
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Support", "/support"],
            ["Privacy Policy", "/privacy"],
            ["Terms of Service", "/terms"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
