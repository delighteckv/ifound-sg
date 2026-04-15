import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

const updatedOn = "April 15, 2026"

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <Navbar />

      <main className="relative min-h-screen px-4 py-12 pt-28">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="space-y-4">
            <Link href="/" className="text-sm text-primary hover:underline">
              Back to iFound
            </Link>
            <div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Terms of Service
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">Last updated: {updatedOn}</p>
            </div>
            <p className="max-w-3xl text-muted-foreground">
              These Terms of Service govern use of iFound web services, Android apps, iOS apps, QR
              landing pages, and related services operated by Zestive Ventures.
            </p>
          </div>

          <section className="space-y-4 rounded-2xl border border-border/50 bg-card/30 p-6">
            <h2 className="text-2xl font-semibold">Company Information</h2>
            <p>Zestive Ventures</p>
            <p>80 BAYSHORE ROAD #03-28 COSTA DEL SOL, Singapore 469992</p>
            <p>
              Contact:{" "}
              <a href="mailto:hello@ifound.sg" className="text-primary hover:underline">
                hello@ifound.sg
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using iFound, you agree to these Terms and our Privacy Policy. If you
              do not agree, do not use the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              iFound provides QR-based item registration, finder-to-owner communication, call
              features, notifications, subscriptions, payment handling, and related account tools.
              Features may differ across web, Android, and iOS platforms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Eligibility and Accounts</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>You must provide accurate account information and keep it updated.</li>
              <li>You are responsible for your account credentials and all activity under your account.</li>
              <li>You may not impersonate another person or use another user&apos;s account without authorization.</li>
              <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Use of the Service</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You agree to use iFound only for lawful purposes. You must not:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Use the platform to harass, abuse, threaten, or deceive other users.</li>
                <li>Upload unlawful, harmful, infringing, or misleading content.</li>
                <li>Interfere with the service, attempt unauthorized access, or bypass security controls.</li>
                <li>Use automated means to scrape, overload, or misuse the platform without written permission.</li>
                <li>Use iFound in a way that violates platform rules, export laws, sanctions, or privacy laws.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Finder Communications and Calls</h2>
            <p className="text-muted-foreground">
              iFound may enable owners and finders to exchange messages or calls. You are responsible
              for the accuracy, legality, and appropriateness of content you send. We may moderate,
              restrict, log, or investigate communications to maintain platform safety and compliance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. User Content and Item Information</h2>
            <p className="text-muted-foreground">
              You retain ownership of content you submit, but you grant iFound a non-exclusive right
              to host, process, transmit, and display that content as necessary to operate and improve
              the service, comply with law, and enforce these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Subscriptions, Payments, and Refunds</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Some features may require a paid subscription or paid service plan.</li>
              <li>Fees, billing intervals, and plan details are shown at the point of purchase.</li>
              <li>You authorize us and our payment providers to process charges for your selected plan.</li>
              <li>Refunds, if any, are governed by the terms shown at purchase and applicable law.</li>
              <li>Apple App Store and Google Play purchases may also be subject to their platform billing rules.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. App Store and Play Store Compliance</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                If you download iFound through Apple App Store or Google Play, you also acknowledge
                the following:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>The license granted to you is non-transferable and limited to supported devices you own or control.</li>
                <li>Apple and Google are not responsible for maintenance, support, or warranty obligations unless required by law.</li>
                <li>Apple and Google are not responsible for claims arising from your use of the app, except as required under their platform terms.</li>
                <li>You must comply with applicable third-party terms when using the app.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Intellectual Property</h2>
            <p className="text-muted-foreground">
              iFound, its branding, software, designs, workflows, and related materials are owned by
              or licensed to Zestive Ventures. Except for rights expressly granted, no rights are
              transferred to you.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Suspension and Termination</h2>
            <p className="text-muted-foreground">
              We may suspend, restrict, or terminate access to the service at any time where
              reasonably necessary for security, abuse prevention, non-payment, legal compliance, or
              violations of these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Disclaimers</h2>
            <p className="text-muted-foreground">
              iFound is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee that any
              lost item will be recovered, that communications will always be delivered, or that the
              service will be uninterrupted or error-free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Zestive Ventures and its affiliates, officers,
              employees, and service providers will not be liable for indirect, incidental, special,
              consequential, exemplary, or punitive damages, or for loss of profits, data, goodwill,
              or business arising from use of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Indemnity</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless Zestive Ventures from claims, damages, losses,
              liabilities, and costs arising from your misuse of iFound, your content, your violation
              of these Terms, or your violation of applicable law or third-party rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">14. Changes to the Service or Terms</h2>
            <p className="text-muted-foreground">
              We may modify the service or these Terms from time to time. Continued use after updated
              Terms take effect means you accept the revised Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">15. Contact</h2>
            <p className="text-muted-foreground">
              Questions about these Terms may be sent to{" "}
              <a href="mailto:hello@ifound.sg" className="text-primary hover:underline">
                hello@ifound.sg
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
