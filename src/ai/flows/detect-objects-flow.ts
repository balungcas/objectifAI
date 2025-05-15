'use server';
/**
 * @fileOverview AI flow to detect objects in an image using a multimodal LLM.
 *
 * - detectObjectsInImage - A function that detects objects in an image.
 * - DetectObjectsInput - The input type for the detectObjectsInImage function.
 * - DetectObjectsOutput - The return type for the detectObjectsInImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Consistent with DetectedObject in @/types and CorrectLabelsOutput
const DetectedObjectSchema = z.object({
  box: z.array(z.number()).length(4).describe('Bounding box coordinates [x_min, y_min, x_max, y_max], normalized to 0-1 range.'),
  class: z.string().describe('The predicted class label for the object.'),
  confidence: z.number().min(0).max(1).describe('The confidence score of the prediction (0.0 to 1.0).'),
});

const DetectObjectsInputSchema = z.object({
  imageDataUri: z.string().describe(
    "The image in which to detect objects, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

const DetectObjectsOutputSchema = z.array(DetectedObjectSchema);
export type DetectObjectsOutput = z.infer<typeof DetectObjectsOutputSchema>;

export async function detectObjectsInImage(input: DetectObjectsInput): Promise<DetectObjectsOutput> {
  return detectObjectsFlow(input);
}

const detectObjectsPrompt = ai.definePrompt({
  name: 'detectObjectsPrompt',
  input: {schema: DetectObjectsInputSchema},
  output: {schema: DetectObjectsOutputSchema},
  prompt: `You are an advanced object detection model. Analyze the provided image and identify all significant objects within it.
For each detected object, provide:
1. 'class': The most specific and common name for the object (e.g., "cat", "red apple", "laptop").
2. 'box': A list of four numbers representing the bounding box of the object: [x_min, y_min, x_max, y_max]. These coordinates must be normalized, where (0,0) is the top-left corner and (1,1) is the bottom-right corner of the image.
3. 'confidence': A score between 0.0 and 1.0 indicating your confidence in the detection and classification.

Return your findings as a JSON array of objects, where each object follows this structure:
{
  "class": "object_name",
  "box": [x_min, y_min, x_max, y_max],
  "confidence": score
}

If no objects are detected, return an empty array.

Image to analyze:
{{media url=imageDataUri}}
`,
});

const detectObjectsFlow = ai.defineFlow(
  {
    name: 'detectObjectsFlow',
    inputSchema: DetectObjectsInputSchema,
    outputSchema: DetectObjectsOutputSchema,
  },
  async (input) => {
    const {output} = await detectObjectsPrompt(input);
    // Ensure output is not null, and if it's empty or invalid, return an empty array.
    // The schema validation handles the structure, but an empty array is valid.
    return output || [];
  }
);
