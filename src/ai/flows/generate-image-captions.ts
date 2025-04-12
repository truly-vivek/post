// The directive tells the Next.js runtime that the code in this file
// should only be executed on the server side.
'use server';

/**
 * @fileOverview Generates captions for an image.
 *
 * - generateImageCaptions - A function that generates captions for an image.
 * - GenerateImageCaptionsInput - The input type for the generateImageCaptions function.
 * - GenerateImageCaptionsOutput - The return type for the generateImageCaptions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateImageCaptionsInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the image to caption.'),
});
export type GenerateImageCaptionsInput = z.infer<
  typeof GenerateImageCaptionsInputSchema
>;

const GenerateImageCaptionsOutputSchema = z.object({
  captions: z
    .array(z.string())
    .describe('An array of generated captions for the image.'),
});
export type GenerateImageCaptionsOutput = z.infer<
  typeof GenerateImageCaptionsOutputSchema
>;

export async function generateImageCaptions(
  input: GenerateImageCaptionsInput
): Promise<GenerateImageCaptionsOutput> {
  return generateImageCaptionsFlow(input);
}

const analyzeImageTool = ai.defineTool({
  name: 'analyzeImage',
  description: 'Analyzes an image and returns a description of its contents.',
  inputSchema: z.object({
    photoUrl: z.string().describe('The URL of the image to analyze.'),
  }),
  outputSchema: z.string(),
},
async input => {
  // In a real implementation, this would call an image analysis service.
  // For now, it just returns a placeholder.
  return `This image features a ${input.photoUrl}`;
});

const prompt = ai.definePrompt({
  name: 'generateImageCaptionsPrompt',
  input: {
    schema: z.object({
      photoAnalysis: z.string().describe('The analysis of the image.'),
    }),
  },
  output: {
    schema: z.object({
      captions: z
        .array(z.string())
        .describe('An array of generated captions for the image.'),
    }),
  },
  prompt: `You are a social media expert. Generate a few relevant captions for the image based on the analysis below:

Image Analysis: {{{photoAnalysis}}}

Captions:`, // Ensure the output is an array of strings.
  tools: [analyzeImageTool],
});

const generateImageCaptionsFlow = ai.defineFlow<
  typeof GenerateImageCaptionsInputSchema,
  typeof GenerateImageCaptionsOutputSchema
>(
  {
    name: 'generateImageCaptionsFlow',
    inputSchema: GenerateImageCaptionsInputSchema,
    outputSchema: GenerateImageCaptionsOutputSchema,
  },
  async input => {
    const photoAnalysis = await analyzeImageTool(input);
    const {output} = await prompt({
      photoAnalysis,
    });
    // Ensure the output.captions is an array of strings
    if (!Array.isArray(output?.captions)) {
      throw new Error(
        'The AI model returned captions in an unexpected format.  Expected an array of strings.'
      );
    }

    return {
      captions: output.captions,
    };
  }
);
