import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageCarouselProps {
  images?: string[];
  title: string;
  isHovered: boolean;
}

export function ImageCarousel({ images = [], title, isHovered }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const totalImages = images.length;

  // If no images, show a placeholder
  if (!images || images.length === 0) {
    return (
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-gray-400">No images available</span>
        </div>
      </div>
    );
  }

  const showNavigation = totalImages > 1;

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % totalImages);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div className="relative h-48 w-full overflow-hidden">
      {/* Image */}
      <div 
        className="relative h-full w-full"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <div className="absolute flex h-full w-full">
          {images.map((image, index) => (
            <div
              key={index}
              className="h-full min-w-full"
            >
              <img
                src={image}
                alt={`${title} - Image ${index + 1}`}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-300",
                  isHovered && "scale-110"
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showNavigation && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-800 opacity-0 shadow-md transition-opacity hover:bg-white",
              isHovered && "opacity-100"
            )}
            onClick={goToPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-800 opacity-0 shadow-md transition-opacity hover:bg-white",
              isHovered && "opacity-100"
            )}
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {showNavigation && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white/60 transition-all",
                index === currentIndex && "w-3 bg-white"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}