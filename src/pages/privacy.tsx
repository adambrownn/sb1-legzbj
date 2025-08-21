import React from 'react';

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Privacy Policy</h1>
      <div className="prose prose-lg max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us, including when you create an account,
          make a booking, or contact us for support.
        </p>
        
        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve our services,
          to process your bookings, and to communicate with you.
        </p>
        
        <h2>3. Information Sharing</h2>
        <p>
          We do not sell your personal information. We share your information only with your consent
          or as necessary to provide the services you request.
        </p>
        
        <h2>4. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information
          against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </div>
    </div>
  );
}