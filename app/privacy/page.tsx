import Link from "next/link"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

const updatedOn = "April 15, 2026"

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">Last updated: {updatedOn}</p>
            </div>
            <p className="max-w-3xl text-muted-foreground">
              This Privacy Policy explains how iFound collects, uses, stores, and shares personal
              data across our website, Android app, iOS app, and related services. iFound belongs to
              Zestive Ventures.
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
            <h2 className="text-2xl font-semibold">1. Scope</h2>
            <p className="text-muted-foreground">
              This policy applies to iFound web pages, the iFound Android application, the iFound
              iOS application, QR landing pages, customer support communications, and backend systems
              that support item registration, messaging, calling, notifications, subscriptions, and
              account management.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We may collect the following categories of data:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Account data such as name, email address, phone number, and login provider.</li>
                <li>Authentication data such as sign-in method, device tokens, and security events.</li>
                <li>Item data such as item names, QR code assignments, descriptions, and photos.</li>
                <li>
                  Finder interaction data such as scan time, message content, contact information
                  voluntarily shared by a finder, and call initiation events.
                </li>
                <li>
                  Subscription and payment data such as plan type, billing status, payment references,
                  and transaction amounts. We do not store full card numbers unless explicitly stated
                  by the payment processor.
                </li>
                <li>
                  Technical data such as device type, operating system, app version, browser type,
                  IP address, crash diagnostics, and usage analytics.
                </li>
                <li>Support and communications data when you contact us for assistance.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. How We Collect Information</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Directly from you when you create an account, register an item, or contact support.</li>
              <li>From external identity providers such as Google or Apple when you choose those login methods.</li>
              <li>From finders who scan a QR code and send a message or initiate a call.</li>
              <li>Automatically through app, web, and backend logs used for security and service operations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. How We Use Information</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>To create and maintain your account.</li>
              <li>To assign QR codes to items and route finder communications to the correct owner.</li>
              <li>To send notifications, alerts, verification codes, service messages, and support responses.</li>
              <li>To process subscriptions, payments, refunds, and billing records.</li>
              <li>To improve security, prevent abuse, investigate fraud, and enforce our policies.</li>
              <li>To measure service usage, scans, contacts, subscriptions, and service performance.</li>
              <li>To comply with legal obligations and valid law enforcement requests.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Mobile App Permissions</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>The Android and iOS apps may request access to device features only where needed for app functionality.</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Camera access to scan QR codes or upload item images.</li>
                <li>Microphone access to enable owner or finder calls.</li>
                <li>Photo library or storage access to attach item photos or download QR images.</li>
                <li>Push notification permission to deliver alerts and account notices.</li>
                <li>
                  Contact, phone, or call-related capabilities only if required by the feature you
                  actively use and supported by your device and operating system.
                </li>
              </ul>
              <p>
                You can deny or revoke permissions through device settings, but parts of the service
                may not function correctly as a result.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Sharing of Information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We do not sell personal data. We may share information only in the following cases:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>With service providers who help us run authentication, hosting, analytics, messaging, calling, and payments.</li>
                <li>With payment processors for billing and transaction handling.</li>
                <li>With mobile platform providers or communication providers as technically required to deliver app functionality.</li>
                <li>With authorities or other parties when required by law or to protect rights, safety, and security.</li>
                <li>As part of a merger, sale, financing, or business restructuring involving Zestive Ventures.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Finder and Owner Privacy</h2>
            <p className="text-muted-foreground">
              iFound is designed to limit unnecessary disclosure of personal contact details. Finder
              and owner details may be mediated through the platform instead of being shown directly,
              depending on product settings and feature design. Users are responsible for any contact
              details or message contents they voluntarily share.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain information only for as long as reasonably necessary for service operation,
              billing, security, legal compliance, dispute resolution, and policy enforcement.
              Retention periods may vary by data category and applicable law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Security</h2>
            <p className="text-muted-foreground">
              We use administrative, technical, and organizational safeguards intended to protect
              personal data. No system is completely secure, and we cannot guarantee absolute
              security of information transmitted or stored through the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. International Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be processed in jurisdictions outside your country of residence.
              Where applicable, we take reasonable steps to ensure information receives an appropriate
              level of protection.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Your Choices and Rights</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>You may access and update certain account details from within the app or website.</li>
              <li>You may manage notification preferences through app settings or device settings.</li>
              <li>You may request account deletion or data access by contacting us at hello@ifound.sg.</li>
              <li>You may revoke mobile app permissions through your device settings.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Children</h2>
            <p className="text-muted-foreground">
              iFound is not directed to children under the age prohibited by applicable law for
              independent use of the service. If you believe a child has provided personal data
              improperly, contact us and we will review the request.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Changes to this Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. Continued use of the service after
              an update means the updated policy applies to the extent permitted by law.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
