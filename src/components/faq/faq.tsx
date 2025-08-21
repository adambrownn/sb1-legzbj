import React from 'react';

const faqs = [
  {
    question: 'How do I book a property?',
    answer: 'You can book a property by browsing our listings, selecting your desired dates, and following the booking process. You\'ll need to create an account if you haven\'t already.'
  },
  {
    question: 'What is the cancellation policy?',
    answer: 'Cancellation policies vary by property. Each listing clearly displays its cancellation policy, which you can review before booking.'
  },
  {
    question: 'How do I contact the host?',
    answer: 'Once your booking is confirmed, you\'ll have access to the host\'s contact information through our messaging system.'
  },
  {
    question: 'Are the prices shown per night?',
    answer: 'Yes, all prices shown are per night unless otherwise specified. Additional fees such as cleaning or service fees will be clearly displayed during booking.'
  }
];

export function FAQ() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-center text-3xl font-bold text-gray-900">
        Frequently Asked Questions
      </h2>
      <div className="mt-8">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {faq.question}
            </h3>
            <p className="mt-2 text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}