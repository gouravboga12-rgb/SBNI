import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BannerSlide {
  id: string;
  image: string;
  title?: string;
  badge?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoScrollIntervalMs?: number;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  slides,
  autoScrollIntervalMs = 4000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-scrolling left to right effect
  useEffect(() => {
    if (isHovered || slides.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoScrollIntervalMs);

    return () => clearInterval(timer);
  }, [isHovered, slides.length, autoScrollIntervalMs, handleNext]);

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 shadow-md h-48 sm:h-60 md:h-72 lg:h-[380px] xl:h-[430px] w-full group mb-6 bg-slate-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slide Images */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title || `Banner Slide ${index + 1}`}
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out transform group-hover:scale-105"
              />
              
              {/* Dark Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-4 sm:p-6" />

              {/* Slide Title / Badge Overlay */}
              {(slide.title || slide.badge) && (
                <div className="absolute bottom-4 left-4 right-16 sm:bottom-6 sm:left-6 sm:right-20 z-20">
                  <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-100 inline-flex items-center gap-2 shadow-lg max-w-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="truncate">{slide.title || slide.badge}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Left Navigation Arrow */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/20 text-white backdrop-blur-md shadow-lg transition-all active:scale-95 opacity-90 hover:opacity-100 focus:outline-none"
        title="Previous Slide"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Right Navigation Arrow */}
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/20 text-white backdrop-blur-md shadow-lg transition-all active:scale-95 opacity-90 hover:opacity-100 focus:outline-none"
        title="Next Slide"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Bottom Indicator Dots */}
      <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 z-30 flex items-center gap-1.5 bg-slate-950/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-5 bg-emerald-400'
                : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
            title={`Go to slide ${index + 1}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
