'use server';

import { correctLabels, CorrectLabelsInput } from '@/ai/flows/correct-labels';
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
    const imageUrl = await fileToDataUrl(imageFile);

    // Simulate initial object detection (replace with actual model if available)
    // These are relative coordinates [x1, y1, x2, y2] from 0 to 1
    const simulatedDetections: DetectedObject[] = [
      {
        box: [0.1, 0.1, 0.5, 0.6], // x1, y1, x2, y2 (relative)
        class: 'Object A',
        confidence: 0.85,
      },
      {
        box: [0.6, 0.3, 0.9, 0.8], // x1, y1, x2, y2 (relative)
        class: 'Item B',
        confidence: 0.72,
      },
    ];

    const aiInput: CorrectLabelsInput = {
      imageUrl,
      detectedObjects: simulatedDetections.map(obj => ({
        ...obj,
        // The AI flow expects box as simple number array.
        // If it expects absolute coords, this needs adjustment based on original image dimensions.
        // For now, passing relative coords and assuming AI flow handles or ignores scaling.
      })),
    };

    const correctedObjectsResponse = await correctLabels(aiInput);
    
    // Ensure the output from AI matches our DetectedObject structure, especially the box.
    // The AI flow is defined to return box as number[4], class string, confidence number.
    const correctedObjects: DetectedObject[] = correctedObjectsResponse.map(obj => ({
        box: obj.box as [number, number, number, number], // Assuming AI returns valid box array
        class: obj.class,
        confidence: obj.confidence,
    }));


    return { correctedObjects, imageUrl };
  } catch (error) {
    console.error('Error processing image:', error);
    return { correctedObjects: [], imageUrl: '', error: 'Failed to process image. Please try again.' };
  }
}
