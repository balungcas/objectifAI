'use server';

/**
 * @fileOverview AI flow to correct object detection labels using an LLM.
 *
 * - correctLabels - A function that corrects the labels of detected objects in an image.
 * - CorrectLabelsInput - The input type for the correctLabels function.
 * - CorrectLabelsOutput - The return type for the correctLabels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectLabelsInputSchema = z.object({
  imageDataUri: z.string().describe(
    "The image containing the objects, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  detectedObjects: z.array(
    z.object({
      box: z.array(z.number()).length(4).describe('Bounding box coordinates [x_min, y_min, x_max, y_max], normalized.'),
      class: z.string().describe('The predicted class label.'),
      confidence: z.number().min(0).max(1).describe('The confidence score of the prediction (0.0 to 1.0).'),
    })
  ).describe('The list of initially detected objects with bounding boxes, classes, and confidences.'),
});
export type CorrectLabelsInput = z.infer<typeof CorrectLabelsInputSchema>;

const CorrectLabelsOutputSchema = z.array(
  z.object({
    box: z.array(z.number()).length(4).describe('Bounding box coordinates [x_min, y_min, x_max, y_max], normalized.'),
    class: z.string().describe('The corrected class label.'),
    confidence: z.number().min(0).max(1).describe('The confidence score of the prediction (can be original or adjusted, 0.0 to 1.0).'),
  })
);
export type CorrectLabelsOutput = z.infer<typeof CorrectLabelsOutputSchema>;

export async function correctLabels(input: CorrectLabelsInput): Promise<CorrectLabelsOutput> {
  return correctLabelsFlow(input);
}

const correctLabelsPrompt = ai.definePrompt({
  name: 'correctLabelsPrompt',
  input: {schema: CorrectLabelsInputSchema},
  output: {schema: CorrectLabelsOutputSchema},
  prompt: `You are an expert in object recognition and label refinement.
You will be provided with an image and a list of objects that have already been detected in it, including their bounding boxes, initial class labels, and confidence scores.

Your task is to:
1. Review the image and the initial detections.
2. For each object, verify or correct its class label to be more accurate or specific if possible.
3. Maintain the original bounding box. Adjust the confidence score if you make a significant correction to the label or if the initial confidence seems highly inaccurate for the (potentially corrected) label.

Return the list of objects. Each object in the list must strictly follow this JSON structure:
{
  "box": [x_min, y_min, x_max, y_max], // Original normalized bounding box
  "class": "Potentially_Corrected_Class_Name",
  "confidence": original_or_adjusted_confidence_score // Between 0.0 and 1.0
}

Ensure the output is a valid JSON array of these objects. If an initial detection is completely erroneous and should be removed, you may omit it from the returned array. If no objects were provided or all are to be omitted, return an empty array.

Image:
{{media url=imageDataUri}}

Initial Detections:
{{#if detectedObjects.length}}
{{#each detectedObjects}}
- Box: [{{{box.[0]}}}, {{{box.[1]}}}, {{{box.[2]}}}, {{{box.[3]}}}], Class: "{{{class}}}", Confidence: {{{confidence}}}
{{/each}}
{{else}}
- No initial objects detected.
{{/if}}
`,
});


const correctLabelsFlow = ai.defineFlow(
  {
    name: 'correctLabelsFlow',
    inputSchema: CorrectLabelsInputSchema,
    outputSchema: CorrectLabelsOutputSchema,
  },
  async (input) => {
    // If no objects detected initially, no need to correct, return empty array.
    if (!input.detectedObjects || input.detectedObjects.length === 0) {
      return [];
    }
    const {output} = await correctLabelsPrompt(input);
    return output || []; // Ensure output is not null
  }
);
