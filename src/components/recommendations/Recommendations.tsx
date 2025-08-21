import React from 'react';
import { getRecommendations } from '@/lib/recommendations/recommendation-engine';

interface Property {
  id: string;
  type: string;
  location: string;
  price: number;
}

interface RecommendationsProps {
  properties: Property[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ properties }) => {
  const recommendedProperties = getRecommendations(properties);

  return (
    <div className="recommendations">
      <h2>Recommended for You</h2>
      <div className="property-list">
        {recommendedProperties.map((property) => (
          <div key={property.id} className="property-item">
            <h3>{property.type}</h3>
            <p>Location: {property.location}</p>
            <p>Price: ${property.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
