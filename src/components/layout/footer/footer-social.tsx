import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: Facebook,
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: Instagram,
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    icon: Twitter,
  },
];

export function FooterSocial() {
  return (
    <div className="flex space-x-6">
      {SOCIAL_LINKS.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 transition-colors hover:text-gray-500"
            aria-label={link.label}
          >
            <Icon className="h-6 w-6" />
          </a>
        );
      })}
    </div>
  );
}