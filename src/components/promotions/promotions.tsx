// src/components/promotions/promotions.tsx
import React from 'react';
import { format } from 'date-fns';
import { Tag, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PromotionalProperty } from '@/types/promotion';
import { useNavigate } from 'react-router-dom';


interface PromotionsProps {
  promotions: PromotionalProperty[];
  className?: string;
}

export function Promotions({ promotions, className }: PromotionsProps) {
  const navigate = useNavigate();

  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-2xl font-bold">Current Offers</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((property) => (
          <Card key={property.id} className="overflow-hidden">
            <div className="relative">
              <img
                src={property.imageUrl}
                alt={property.name}
                className="h-48 w-full object-cover"
              />
              <Badge
                className="absolute right-2 top-2 bg-red-600"
                variant="secondary"
              >
                {property.promotion.discountPercentage}% OFF
              </Badge>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold">{property.name}</h3>
              <p className="text-sm text-gray-600">{property.location}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {property.promotion.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    Valid until {format(new Date(property.promotion.validUntil), 'MMM dd, yyyy')}
                  </span>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {property.promotion.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">${property.price}</span>
                  <span className="text-sm text-gray-600">/night</span>
                </div>
                <Button
                  onClick={() => navigate(`/properties/${property.id}`)}
                  variant="default"
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}