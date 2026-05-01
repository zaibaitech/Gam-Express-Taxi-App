import Link from 'next/link';
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY } from '@/lib/config';

export const metadata = { title: 'Privacy Policy — Gam Express Taxi' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="text-primary-600 hover:text-primary-800 text-sm font-semibold mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: April 2026 · Gam Express Taxi, Banjul, The Gambia</p>
          </div>

          <Section title="1. Information We Collect">
            When you book a ride we collect:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Name and phone number</strong> — to identify you and connect you with your driver.</li>
              <li><strong>Pickup and drop-off locations</strong> — to fulfil your booking.</li>
              <li><strong>Payment method preference</strong> — cash or mobile money.</li>
              <li><strong>Ride ratings</strong> — to maintain driver quality.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To match you with an available driver.</li>
              <li>To allow your driver to contact you at the pickup point.</li>
              <li>To calculate your fare estimate.</li>
              <li>To improve our service quality.</li>
            </ul>
            We do not sell your personal data to third parties.
          </Section>

          <Section title="3. Data Sharing">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Drivers</strong> — see your name, phone number, and pickup/drop-off locations for your booking only.</li>
              <li><strong>Supabase</strong> — our database provider. Data is stored on secure servers.</li>
              <li>We do not share your data with advertisers or other third parties.</li>
            </ul>
          </Section>

          <Section title="4. Data Retention">
            Booking records are retained for up to 12 months for support and dispute resolution purposes, then deleted.
            You may request early deletion by contacting us.
          </Section>

          <Section title="5. Your Rights">
            You have the right to:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Request access to your personal data.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
            </ul>
            Contact us at <a href={`tel:${SUPPORT_PHONE}`} className="text-primary-600 underline">{SUPPORT_PHONE_DISPLAY}</a> to exercise these rights.
          </Section>

          <Section title="6. Security">
            We use industry-standard security practices including encrypted database connections and access controls.
            However, no method of internet transmission is 100% secure.
          </Section>

          <Section title="7. Driver Location Data">
            Drivers share their GPS location while online. This data is used only to match nearby drivers to bookings
            and is not stored long-term.
          </Section>

          <Section title="8. Cookies">
            This website uses minimal session cookies required for the admin login system. We do not use tracking
            or advertising cookies.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this policy from time to time. The date at the top of this page reflects the latest revision.
          </Section>

          <Section title="10. Contact">
            For any privacy concerns, contact us at{' '}
            <a href={`tel:${SUPPORT_PHONE}`} className="text-primary-600 underline">{SUPPORT_PHONE_DISPLAY}</a>{' '}
            or WhatsApp the same number.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
      <div className="text-gray-600 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
