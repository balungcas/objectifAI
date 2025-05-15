'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DetectedObject } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

interface DetectionResultDisplayProps {
  imageUrl: string;
  detections: DetectedObject[];
}

// Helper to get contrasting text color
const getContrastingTextColor = (hexColor: string): string => {
  if (!hexColor.startsWith('#')) return '#003049'; // Default to deep blue
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#003049' : '#FFFFFF'; // Deep Blue or White
};

// Generate a color from a string (class name)
const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};


export function DetectionResultDisplay({ imageUrl, detections }: DetectionResultDisplayProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  }, [imageUrl]);


  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageDimensions({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    });
  };
  
  if (!imageUrl) return null;

  return (
    <Card className="w-full max-w-2xl mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Eye className="mr-2 h-6 w-6 text-primary" />
          Detection Results
        </CardTitle>
        <CardDescription>Detected objects with their labels and bounding boxes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-w-4 aspect-h-3 overflow-hidden rounded-md border border-input">
          <Image
            ref={imageRef}
            src={imageUrl}
            alt="Uploaded image with detections"
            fill
            style={{ objectFit: 'contain' }}
            onLoad={handleImageLoad}
            data-ai-hint="detection result"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 672px"
          />
          {imageDimensions && detections.map((detection, index) => {
            const { box, class: label, confidence } = detection;
            
            // Assuming box coordinates are relative [x1, y1, x2, y2]
            const x1 = box[0] * 100;
            const y1 = box[1] * 100;
            const width = (box[2] - box[0]) * 100;
            const height = (box[3] - box[1]) * 100;

            const boxColor = generateColorFromString(label);
            const textColor = getContrastingTextColor(boxColor);

            return (
              <div
                key={index}
                className="absolute border-2 group transition-all duration-200 ease-in-out hover:shadow-lg"
                style={{
                  left: `${x1}%`,
                  top: `${y1}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  borderColor: boxColor,
                  boxShadow: `0 0 10px ${boxColor}33`,
                }}
                aria-label={`Detected object: ${label}`}
              >
                <Badge
                  className="absolute -top-0.5 -left-0.5 transform -translate-y-1/2 px-2 py-1 text-xs whitespace-nowrap group-hover:scale-105 transition-transform"
                  style={{ 
                    backgroundColor: boxColor, 
                    color: textColor,
                    borderColor: textColor, // Add border for better visibility
                    borderWidth: '1px'
                  }}
                >
                  {label} ({Math.round(confidence * 100)}%)
                </Badge>
              </div>
            );
          })}
        </div>
        {detections.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">No objects detected or AI could not process the request.</p>
        )}
      </CardContent>
    </Card>
  );
}
