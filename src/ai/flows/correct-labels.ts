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
  imageUrl: z.string().describe('The URL of the image.'),
  detectedObjects: z.array(
    z.object({
      box: z.array(z.number()).length(4).describe('Bounding box coordinates [x1, y1, x2, y2].'),
      class: z.string().describe('The predicted class label.'),
      confidence: z.number().describe('The confidence score of the prediction.'),
    })
  ).describe('The list of detected objects with bounding boxes, classes, and confidences.'),
});
export type CorrectLabelsInput = z.infer<typeof CorrectLabelsInputSchema>;

const CorrectLabelsOutputSchema = z.array(
  z.object({
    box: z.array(z.number()).length(4).describe('Bounding box coordinates [x1, y1, x2, y2].'),
    class: z.string().describe('The corrected class label.'),
    confidence: z.number().describe('The confidence score of the prediction.'),
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
  prompt: `You are an expert in object recognition. You will be provided with a list of objects detected in an image, along with their bounding boxes, predicted class labels, and confidence scores.

  Your task is to review the predicted class labels and correct them if necessary. Provide the corrected class labels in the same format as the input.

  Here's the image URL: {{{imageUrl}}}

  Here's the list of detected objects:
  {{#each detectedObjects}}
  - Box: {{{box}}}, Class: {{{class}}}, Confidence: {{{confidence}}}
  {{/each}}

  Return the corrected list of objects with the same format as the input, only changing the class if it is incorrect.
  [
  {{#each detectedObjects}}
    {
      "box": [{{{box.0}}}, {{{box.1}}}, {{{box.2}}}, {{{box.3}}}]
      "class": "Corrected Class Here",
      "confidence": Confidence score here,
    },
  {{/each}}
  ]
  `,
});

const correctLabelsFlow = ai.defineFlow(
  {
    name: 'correctLabelsFlow',
    inputSchema: CorrectLabelsInputSchema,
    outputSchema: CorrectLabelsOutputSchema,
  },
  async input => {
    const {output} = await correctLabelsPrompt(input);
    return output!;
  }
);
