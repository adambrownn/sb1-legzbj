import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { FooterLinks } from './footer-links';
import { FooterSocial } from './footer-social';

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                Rovers Suites
              </span>
            </Link>
            <p className="text-base text-gray-500">
              Making your travel dreams come true with exceptional stays worldwide.
            </p>
            <FooterSocial />
          </div>

          {/* Quick Links */}
          <div className="mt-12 xl:col-span-2 xl:mt-0">
            <FooterLinks />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Rovers Suites. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}