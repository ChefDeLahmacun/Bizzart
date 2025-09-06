'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  zoomLevel?: number;
  onImageClick?: () => void;
}

export function ProductImageZoom({
  src,
  alt,
  width = 400,
  height = 400,
  className = '',
  zoomLevel = 1.5,
  onImageClick
}: ProductImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isZoomed) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Update position immediately for better accuracy
    setZoomPosition({ x, y });
  }, [isZoomed]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isZoomed) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

    // Update position immediately for better accuracy
    setZoomPosition({ x, y });
  }, [isZoomed]);

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onImageClick) {
      onImageClick();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Calculate zoom transform with improved positioning
  const getZoomTransform = () => {
    if (!isZoomed) return {};
    
    const scale = zoomLevel;
    // Calculate translation to center the zoomed area under the mouse
    // Fix the inverted position by negating the translation values
    const translateX = -(zoomPosition.x - 0.5) * (scale - 1) * 100;
    const translateY = -(zoomPosition.y - 0.5) * (scale - 1) * 100;

    return {
      transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
      transformOrigin: 'center',
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-pointer group ${className}`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Image Container */}
      <div className="relative w-full h-full">
        <div
          className={`w-full h-full transition-transform duration-300 ease-out ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-pointer'
          }`}
          style={getZoomTransform()}
          onClick={handleImageClick}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleLoad}
            priority={false}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Zoom Indicator */}
        {isZoomed && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
            <MagnifyingGlassIcon className="w-3 h-3" />
            Zoom Active
          </div>
        )}

        {/* Zoom Instructions */}
        {!isZoomed && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 z-10">
            <MagnifyingGlassIcon className="w-3 h-3" />
            Hover to zoom
          </div>
        )}
      </div>
    </div>
  );
}
