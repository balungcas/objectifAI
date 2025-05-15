'use client';

import React, { useState } from 'react';
import { ImageUploadForm } from '@/components/image-upload-form';
import { DetectionResultDisplay } from '@/components/detection-result-display';
import { detectObjectsAction } from '@/app/actions/detect-objects';
import type { DetectedObject } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ObjectDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [detectionResults, setDetectionResults] = useState<DetectedObject[]>([]);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFormSubmit = async (formData: FormData) => {
    if (!selectedFile) {
      setError('Please select an image first.');
      toast({
        title: "Error",
        description: "Please select an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDetectionResults([]); // Clear previous results
    setProcessedImageUrl(null);

    try {
      const result = await detectObjectsAction(formData);
      if (result.error) {
        setError(result.error);
        toast({
          title: "Detection Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setDetectionResults(result.correctedObjects);
        setProcessedImageUrl(result.imageUrl); // The image URL used for processing
         toast({
          title: "Detection Successful",
          description: `${result.correctedObjects.length} object(s) processed.`,
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 md:p-12 bg-gradient-to-br from-background to-secondary/30">
      <header className="mb-8 sm:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
          ObjectifAI
        </h1>
        <p className="text-lg text-foreground/80 mt-2">
          Upload an image and let AI detect and label objects.
        </p>
      </header>

      <ImageUploadForm
        onFormSubmit={handleFormSubmit}
        isProcessing={isProcessing}
        imagePreviewUrl={imagePreviewUrl}
        setImagePreviewUrl={setImagePreviewUrl}
        setSelectedFile={setSelectedFile}
        uploadError={uploadError}
        setUploadError={setUploadError}
      />

      {error && (
        <Alert variant="destructive" className="mt-8 w-full max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {processedImageUrl && detectionResults && (
         <DetectionResultDisplay
          imageUrl={processedImageUrl}
          detections={detectionResults}
        />
      )}
      
      {!isProcessing && !processedImageUrl && !error && !imagePreviewUrl && (
        <div className="mt-12 text-center w-full max-w-lg p-8 border-2 border-dashed border-input rounded-lg bg-card/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground opacity-50 mb-4 lucide lucide-image-up"><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L13 16"/><path d="m14 19.5 3-3 3 3"/><path d="M17 22v-5.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.06-3.06a2 2 0 0 0-2.83 0L13 14.01"/></svg>
            <h3 className="text-xl font-semibold text-foreground/90 mb-2">Ready to Analyze</h3>
            <p className="text-muted-foreground">
              Upload an image using the form above to see ObjectifAI in action. 
              Detected objects and their AI-refined labels will appear here.
            </p>
        </div>
      )}
    </main>
  );
}
