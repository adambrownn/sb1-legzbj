import React from 'react';
import { Star, ThumbsUp } from 'lucide-react';

// Mock review data
const MOCK_REVIEWS = [
  {
    id: '1',
    author: 'John Doe',
    rating: 5,
    date: '2024-02-15',
    content: 'Amazing property with stunning views. The host was very accommodating.',
    helpful: 12,
  },
  {
    id: '2',
    author: 'Jane Smith',
    rating: 4,
    date: '2024-02-10',
    content: 'Great location and comfortable stay. Could use some minor updates.',
    helpful: 8,
  },
  {
    id: '3',
    author: 'Mike Johnson',
    rating: 5,
    date: '2024-02-05',
    content: 'Perfect getaway spot! Everything was exactly as described.',
    helpful: 15,
  },
];

export function ReviewsSection() {
  const averageRating = MOCK_REVIEWS.reduce((acc, review) => acc + review.rating, 0) / MOCK_REVIEWS.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Guest Reviews</h2>
          <div className="mt-1 flex items-center">
            <Star className="mr-1 h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="ml-1 text-gray-500">
              ({MOCK_REVIEWS.length} reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {MOCK_REVIEWS.map((review) => (
          <div key={review.id} className="border-b pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{review.author}</h3>
                <div className="mt-1 flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
                <ThumbsUp className="h-4 w-4" />
                <span>{review.helpful}</span>
              </button>
            </div>
            <p className="mt-3 text-gray-600">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}