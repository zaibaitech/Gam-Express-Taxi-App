import Link from 'next/link';

export const metadata = { title: 'Terms of Service — Gam Express Taxi' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="text-primary-600 hover:text-primary-800 text-sm font-semibold mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: April 2026 · Gam Express Taxi, Banjul, The Gambia</p>
          </div>

          <Section title="1. Acceptance of Terms">
            By booking a ride through Gam Express Taxi (the "Service"), you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the Service.
          </Section>

          <Section title="2. The Service">
            Gam Express Taxi is a taxi booking platform connecting passengers with independent drivers operating in The Gambia.
            We facilitate the booking process but are not a transportation company. Drivers are independent contractors.
          </Section>

          <Section title="3. Bookings">
            <ul className="list-disc pl-5 space-y-1">
              <li>Bookings are confirmed once a driver accepts your request.</li>
              <li>You may cancel a booking at no charge while it is in "Pending" or "Accepted" status.</li>
              <li>Once the driver is en route, cancellations may not be possible.</li>
              <li>Provide accurate pickup and drop-off locations to avoid delays.</li>
            </ul>
          </Section>

          <Section title="4. Fares & Payment">
            <ul className="list-disc pl-5 space-y-1">
              <li>Fares displayed are estimates. Final fare is agreed between passenger and driver.</li>
              <li>Payment methods accepted: Cash and Mobile Money (QCell, Africell, Comium).</li>
              <li>Gam Express Taxi does not process payments directly — transactions are between passenger and driver.</li>
            </ul>
          </Section>

          <Section title="5. Passenger Responsibilities">
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide a valid Gambian phone number for driver contact.</li>
              <li>Be ready at your pickup location when the driver arrives.</li>
              <li>Treat drivers with respect. Abusive behaviour may result in service refusal.</li>
              <li>You are responsible for any damage caused to the vehicle during your ride.</li>
            </ul>
          </Section>

          <Section title="6. Driver Conduct">
            All Gam Express drivers are vetted and expected to maintain professional standards. If you experience unsafe
            or inappropriate behaviour, please contact our support team immediately at{' '}
            <a href="tel:+2203456789" className="text-primary-600 underline">+220 345 6789</a>.
          </Section>

          <Section title="7. Limitation of Liability">
            Gam Express Taxi is not liable for any indirect, incidental, or consequential damages arising from the use
            of the Service, including delays, accidents, or loss of property during a ride.
          </Section>

          <Section title="8. Privacy">
            Your personal data is processed in accordance with our{' '}
            <Link href="/privacy" className="text-primary-600 underline">Privacy Policy</Link>.
          </Section>

          <Section title="9. Changes to Terms">
            We reserve the right to update these Terms at any time. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </Section>

          <Section title="10. Contact">
            Questions? Reach us at{' '}
            <a href="tel:+2203456789" className="text-primary-600 underline">+220 345 6789</a>{' '}
            or via WhatsApp at the same number.
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
