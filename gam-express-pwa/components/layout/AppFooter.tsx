'use client';
import Link from 'next/link';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_EMAIL, COMPANY_LOCATION } from '@/lib/config';

export default function AppFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3">Gam Express Taxi</h3>
            <p className="text-sm text-gray-400">
              Your trusted taxi service in The Gambia. Safe, reliable, and always on time.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>📞 Phone: {SUPPORT_PHONE_DISPLAY}</li>
              <li>📧 Email: {SUPPORT_EMAIL}</li>
              <li>📍 Location: {COMPANY_LOCATION}</li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div>
            <h4 className="text-white font-semibold mb-3">Operating Hours</h4>
            <ul className="space-y-2 text-sm">
              <li>Monday - Friday: 24/7</li>
              <li>Weekends: 24/7</li>
              <li>Holidays: Available</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Gam Express Taxi. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
