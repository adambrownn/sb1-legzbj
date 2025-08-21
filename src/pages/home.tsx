import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FeaturedProperties } from '@/components/properties/featured-properties';
import { Footer } from '@/components/layout/footer/footer';
import { FAQ } from '@/components/faq/faq';
import { LiveChat } from '@/components/live-chat/live-chat';
import { Promotions } from '@/components/promotions/promotions';
import { MOCK_PROMOTIONS } from '@/data/promotions';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = React.useState({
    query: '',
    checkInDate: null,
    checkOutDate: null,
    guests: 1,
  });

  console.log('HomePage component rendered');

  const handleSearch = (query: string, checkInDate: Date | null, checkOutDate: Date | null, guests: number) => {
    setSearchParams({ query, checkInDate, checkOutDate, guests });
    navigate('/properties', { state: { searchParams: { query, checkInDate, checkOutDate, guests } } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Featured Properties */}
      <div className="bg-background-darker pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-text">Featured Properties</h2>
          <div className="relative">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6">
                <FeaturedProperties />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions Section */}
      <div className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-text">Special Offers</h2>
          <Promotions promotions={MOCK_PROMOTIONS} />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-background-darker py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FAQ />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-text py-12 text-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-primary-light">About Us</a></li>
                <li><a href="/contact" className="hover:text-primary-light">Contact</a></li>
                <li><a href="/faq" className="hover:text-primary-light">FAQs</a></li>
                <li><a href="/policies" className="hover:text-primary-light">Policies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Properties</h3>
              <ul className="space-y-2">
                <li><a href="/properties" className="hover:text-primary-light">All Properties</a></li>
                <li><a href="/featured" className="hover:text-primary-light">Featured Listings</a></li>
                <li><a href="/new" className="hover:text-primary-light">New Additions</a></li>
                <li><a href="/map" className="hover:text-primary-light">Map View</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Support</h3>
              <ul className="space-y-2">
                <li><a href="/help" className="hover:text-primary-light">Help Center</a></li>
                <li><a href="/safety" className="hover:text-primary-light">Safety Information</a></li>
                <li><a href="/cancellation" className="hover:text-primary-light">Cancellation Options</a></li>
                <li><a href="/covid19" className="hover:text-primary-light">COVID-19 Response</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-2xl hover:text-primary"><FaFacebook /></a>
                <a href="#" className="text-2xl hover:text-primary"><FaTwitter /></a>
                <a href="#" className="text-2xl hover:text-primary"><FaInstagram /></a>
                <a href="#" className="text-2xl hover:text-primary"><FaLinkedin /></a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-background/20 pt-8 text-center">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Live Chat */}
      <LiveChat />
    </div>
  );
}