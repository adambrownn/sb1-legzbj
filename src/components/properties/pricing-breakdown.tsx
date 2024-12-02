import React from 'react';
import { Info } from 'lucide-react';

interface PricingBreakdownProps {
  basePrice: number;
  nights: number;
  cleaningFee: number;
  serviceFee: number;
}

export function PricingBreakdown({
  basePrice,
  nights,
  cleaningFee,
  serviceFee,
}: PricingBreakdownProps) {
  const subtotal = basePrice * nights;
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-xl font-semibold">Price Details</h2>
      
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span>${basePrice} × {nights} nights</span>
            <button className="ml-1 rounded-full p-1 hover:bg-gray-100" title="Base nightly rate">
              <Info className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <span>${subtotal}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span>Cleaning fee</span>
            <button className="ml-1 rounded-full p-1 hover:bg-gray-100" title="One-time fee charged by host">
              <Info className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <span>${cleaningFee}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span>Service fee</span>
            <button className="ml-1 rounded-full p-1 hover:bg-gray-100" title="Helps us run our platform">
              <Info className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <span>${serviceFee}</span>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}