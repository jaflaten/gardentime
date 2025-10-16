'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-lg font-bold text-green-600 mb-3">RegenGarden</h3>
            <p className="text-sm text-gray-600">
              Manage your gardens with regenerative farming principles. Track crop rotation,
              plan your growing areas, and cultivate a sustainable future.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/gardens" className="text-sm text-gray-600 hover:text-green-600 transition">
                  My Gardens
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-gray-600 hover:text-green-600 transition">
                  Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-green-600 transition"
                >
                  GitHub
                </a>
              </li>
              <li>
                <span className="text-sm text-gray-600">
                  Documentation
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} RegenGarden. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-sm text-gray-500">Privacy Policy</span>
              <span className="text-sm text-gray-500">Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
