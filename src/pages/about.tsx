import React from 'react';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">About Rovers Suites</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          Welcome to Rovers Suites, your premier destination for exceptional travel accommodations worldwide. 
          Founded with a vision to transform the way people experience travel, we've been connecting travelers 
          with unique and comfortable properties since our inception.
        </p>
        
        <h2 className="mt-8 text-2xl font-semibold">Our Mission</h2>
        <p>
          To provide unforgettable stays by connecting travelers with exceptional properties and hosts, 
          while ensuring seamless, secure, and memorable experiences for everyone involved.
        </p>
        
        <h2 className="mt-8 text-2xl font-semibold">Our Values</h2>
        <ul className="list-disc pl-6">
          <li>Trust and Security</li>
          <li>Quality and Comfort</li>
          <li>Exceptional Service</li>
          <li>Community and Connection</li>
        </ul>
      </div>
    </div>
  );
}