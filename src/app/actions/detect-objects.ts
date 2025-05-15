'use server';

import { correctLabels, CorrectLabelsInput } from '@/ai/flows/correct-labels';
import { detectObjectsInImage, DetectObjectsInput } from '@/ai/flows/detect-objects-flow';
import type { DetectedObject } from '@/types';

// Helper function to convert File to base64
async function fileToDataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export async function detectObjectsAction(
  formData: FormData
): Promise<{ correctedObjects: DetectedObject[]; imageUrl: string; error?: string }> {
  const imageFile = formData.get('image') as File | null;

  if (!imageFile) {
    return { correctedObjects: [], imageUrl: '', error: 'No image file provided.' };
  }

  if (!imageFile.type.startsWith('image/')) {
     return { correctedObjects: [], imageUrl: '', error: 'Invalid file type. Please upload an image.' };
  }

  try {
    const imageDataUri = await fileToDataUrl(imageFile);

    // Step 1: Perform initial object detection using the new AI flow
    const detectionInput: DetectObjectsInput = {
      imageDataUri,
    };
    const initialDetectionsResponse = await detectObjectsInImage(detectionInput);
    
    // Map AI response to DetectedObject structure, ensuring types.
    // The schemas for detectObjectsInImage output and DetectedObject type are aligned.
    const initialDetectedObjects: DetectedObject[] = initialDetectionsResponse.map(obj => ({
        box: obj.box as [number, number, number, number], 
        class: obj.class,
        confidence: obj.confidence,
    }));

    // Step 2: Pass initial detections to the label correction flow
    const correctionInput: CorrectLabelsInput = {
      imageDataUri, 
      detectedObjects: initialDetectedObjects, 
    };

    const correctedObjectsResponse = await correctLabels(correctionInput);
    
    // Ensure the final output from AI matches our DetectedObject structure
    const finalCorrectedObjects: DetectedObject[] = correctedObjectsResponse.map(obj => ({
        box: obj.box as [number, number, number, number], 
        class: obj.class,
        confidence: obj.confidence,
    }));

    return { correctedObjects: finalCorrectedObjects, imageUrl: imageDataUri };
  } catch (error) {
    console.error('Error processing image:', error);
    let errorMessage = 'Failed to process image. Please try again.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // It's good practice to check for Genkit-specific error details if available
    // For example, error.cause or specific error properties from Genkit.
    return { correctedObjects: [], imageUrl: '', error: errorMessage };
  }
}
