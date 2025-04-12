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
  description: 'Analyzes an image and returns a description of its contents. Limits the description to avoid exceeding token limits.',
  inputSchema: z.object({
    photoUrl: z.string().describe('The URL of the image to analyze.'),
  }),
  outputSchema: z.string(),
},
async input => {
  // In a real implementation, this would call an image analysis service.
  // For now, it just returns a placeholder.  We are limiting the size of the description to avoid
  // token limits.
  try {
    let description = `This image features a ${input.photoUrl}`;
    description = description.substring(0, 500);
    if (description.length > 500) {
      description = description.substring(0, 500);
    }
    return description; // Limit to 500 characters to stay within token limits
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
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
  prompt: `You are a social media expert. Generate a few relevant captions for the image based on the analysis below.  The captions should be short, engaging, and appropriate for platforms like Instagram, Twitter, and Facebook. Include relevant hashtags to increase visibility, but don't overdo it. Prefer emojis to text when possible. Vary the captions in style - some should be funny, some thought-provoking, some inspirational. The project's name is Post Captions.

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
    try {
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
    } catch (error: any) {
      console.error("Error generating image captions:", error);
      throw new Error(`Failed to generate captions: ${error.message}`);
    }
  }
);
