import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search/search-bar';
import { FeaturedProperties } from '@/components/properties/featured-properties';
import { Footer } from '@/components/layout/footer/footer';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[600px] bg-gradient-to-b from-blue-600 to-blue-800">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80"
            alt="Hero background"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/70" />
        </div>

        <div className="relative mx-auto flex min-h-[600px] max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Find Your Perfect Getaway
          </h1>
          <p className="mb-8 max-w-md text-lg text-gray-200 sm:max-w-xl md:text-xl">
            Discover unique places to stay, from cozy cabins to luxury villas
          </p>
          <div className="mb-8 w-full max-w-md sm:max-w-xl">
            <SearchBar onSearch={handleSearch} className="search-bar" />
          </div>
          <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
            <Button
              onClick={() => navigate('/properties')}
              size="lg"
              className="w-full bg-white text-blue-600 hover:bg-gray-100 sm:w-auto sm:min-w-[200px]"
            >
              Search Properties
            </Button>
            <Button
              onClick={() => navigate('/auth?type=register')}
              size="lg"
              variant="outline"
              className="w-full border-2 border-white text-white hover:bg-white/10 sm:w-auto sm:min-w-[200px]"
            >
              Become a Host
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
        <div className="mt-8">
          <FeaturedProperties />
        </div>
      </div>

      <Footer />
    </div>
  );
}