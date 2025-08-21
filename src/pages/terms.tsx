import React from 'react';

export function TermsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Terms of Service</h1>
      <div className="prose prose-lg max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Rovers Suites, you agree to be bound by these Terms of Service
          and all applicable laws and regulations.
        </p>
        
        <h2>2. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials
          and for all activities that occur under your account.
        </p>
        
        <h2>3. Booking and Cancellation</h2>
        <p>
          All bookings are subject to availability and confirmation. Cancellation policies
          vary by property and are specified during the booking process.
        </p>
        
        <h2>4. User Conduct</h2>
        <p>
          You agree to use our services only for lawful purposes and in accordance with
          these Terms of Service.
        </p>
      </div>
    </div>
  );
}