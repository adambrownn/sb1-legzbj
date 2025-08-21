import React from 'react';
import { Info } from 'lucide-react';
import type { PropertyPricing } from '@/types/property';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface PricingBreakdownProps {
  pricing: PropertyPricing;
  nights: number;
  guests: number;
  className?: string;
  isEarlyBird?: boolean;
  isLongStay?: boolean;
}

export function PricingBreakdown({
  pricing,
  nights,
  guests,
  className,
  isEarlyBird,
  isLongStay,
}: PricingBreakdownProps) {
  const baseTotal = pricing.baseRate * nights;
  
  // Calculate extra guest fees
  const extraGuestFee = pricing.extraGuestFee ?? 0;
  const includedGuests = pricing.includedGuests ?? 1;
  const extraGuestsCount = Math.max(0, guests - includedGuests);
  const extraGuestsTotal = extraGuestsCount * extraGuestFee * nights;

  // Calculate discounts
  const earlyBirdDiscount = isEarlyBird && pricing.earlyBirdDiscount
    ? (baseTotal * pricing.earlyBirdDiscount.percentage) / 100
    : 0;

  const longStayDiscount = isLongStay && pricing.longStayDiscountPercentage
    ? (baseTotal * pricing.longStayDiscountPercentage) / 100
    : 0;

  // Calculate fees
  const cleaningFee = pricing.cleaningFee ?? 0;
  const serviceFee = pricing.serviceFeePercentage 
    ? (baseTotal * pricing.serviceFeePercentage) / 100
    : 0;

  // Calculate taxes
  const taxableAmount = baseTotal + extraGuestsTotal + cleaningFee + serviceFee - earlyBirdDiscount - longStayDiscount;
  const taxes = pricing.taxRate 
    ? (taxableAmount * pricing.taxRate) / 100
    : 0;

  // Calculate total
  const total = taxableAmount + taxes;

  return (
    <div className={cn('space-y-4', className)}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="pricing-details">
          <AccordionTrigger className="text-lg font-semibold">
            Total: ${total.toFixed(2)}
          </AccordionTrigger>
          <AccordionContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base rate (${pricing.baseRate} × {nights} nights)</span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>

            {extraGuestsTotal > 0 && (
              <div className="flex justify-between text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Extra guest fees
                      <Info className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      ${extraGuestFee} per additional guest beyond {includedGuests} included guest(s)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>${extraGuestsTotal.toFixed(2)}</span>
              </div>
            )}

            {earlyBirdDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Early bird discount
                      <Info className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {pricing.earlyBirdDiscount?.percentage}% off for booking {pricing.earlyBirdDiscount?.daysInAdvance} days in advance
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>-${earlyBirdDiscount.toFixed(2)}</span>
              </div>
            )}

            {longStayDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Long stay discount
                      <Info className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {pricing.longStayDiscountPercentage}% off for stays of {pricing.longStayThreshold}+ nights
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>-${longStayDiscount.toFixed(2)}</span>
              </div>
            )}

            {cleaningFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Cleaning fee</span>
                <span>${cleaningFee.toFixed(2)}</span>
              </div>
            )}

            {serviceFee > 0 && (
              <div className="flex justify-between text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Service fee
                      <Info className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {pricing.serviceFeePercentage}% service fee
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
            )}

            {taxes > 0 && (
              <div className="flex justify-between text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Taxes
                      <Info className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {pricing.taxRate}% tax rate
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>${taxes.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {pricing.cancellationPolicy && (
        <div className="text-sm text-gray-600">
          <h4 className="font-medium mb-1">Cancellation Policy</h4>
          <p>{pricing.cancellationPolicy}</p>
        </div>
      )}
    </div>
  );
}