import React from 'react';
import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export function FooterLinks() {
  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
      {QUICK_LINKS.map((link) => (
        <div key={link.href}>
          <Link
            to={link.href}
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            {link.label}
          </Link>
        </div>
      ))}
    </div>
  );
}