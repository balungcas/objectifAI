'use client';

import type { ChangeEvent, FormEvent } from 'react';
import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ui/loader';
import { UploadCloud, XCircle } from 'lucide-react';

interface ImageUploadFormProps {
  onFormSubmit: (formData: FormData) => Promise<void>;
  isProcessing: boolean;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
  setSelectedFile: (file: File | null) => void;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
}

export function ImageUploadForm({
  onFormSubmit,
  isProcessing,
  imagePreviewUrl,
  setImagePreviewUrl,
  setSelectedFile,
  uploadError,
  setUploadError,
}: ImageUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Invalid file type. Please select an image (JPEG, PNG).');
        setImagePreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('File is too large. Maximum size is 5MB.');
        setImagePreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      setUploadError('Please select an image to upload.');
      return;
    }
    setUploadError(null);
    const formData = new FormData(event.currentTarget);
    await onFormSubmit(formData);
  };

  const handleRemoveImage = () => {
    setImagePreviewUrl(null);
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Upload Image</CardTitle>
        <CardDescription>Select an image from your device to detect objects.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {uploadError && (
            <Alert variant="destructive" className="bg-destructive/10">
              <XCircle className="h-4 w-4 !text-destructive" />
              <AlertDescription className="text-destructive">{uploadError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="image-upload" className="text-base">Choose Image</Label>
            <Input
              id="image-upload"
              name="image"
              type="file"
              accept="image/jpeg, image/png"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="file:text-primary file:font-semibold hover:file:bg-primary/10"
              disabled={isProcessing}
            />
          </div>

          {imagePreviewUrl && (
            <div className="mt-4 relative group">
              <p className="text-sm font-medium mb-2 text-foreground/80">Preview:</p>
              <div className="rounded-md overflow-hidden border-2 border-dashed border-input p-1">
                <Image
                  src={imagePreviewUrl}
                  alt="Image preview"
                  width={400}
                  height={300}
                  className="object-contain w-full h-auto max-h-60 rounded"
                  data-ai-hint="image preview"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-8 right-2 opacity-50 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                onClick={handleRemoveImage}
                disabled={isProcessing}
                aria-label="Remove image"
              >
                <XCircle className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-base py-6" disabled={isProcessing || !imagePreviewUrl}>
            {isProcessing ? (
              <>
                <Loader className="mr-2" /> Processing...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-5 w-5" /> Detect Objects
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
