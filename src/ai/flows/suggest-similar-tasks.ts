'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting similar tasks based on a given task title and description.
 *
 * - suggestSimilarTasks - An async function that takes a task title and description and returns a list of similar task suggestions.
 * - SuggestSimilarTasksInput - The input type for the suggestSimilarTasks function.
 * - SuggestSimilarTasksOutput - The output type for the suggestSimilarTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarTasksInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('The description of the task.'),
});
export type SuggestSimilarTasksInput = z.infer<typeof SuggestSimilarTasksInputSchema>;

const SuggestSimilarTasksOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of similar task suggestions based on the input task.'),
});
export type SuggestSimilarTasksOutput = z.infer<typeof SuggestSimilarTasksOutputSchema>;

export async function suggestSimilarTasks(input: SuggestSimilarTasksInput): Promise<SuggestSimilarTasksOutput> {
  return suggestSimilarTasksFlow(input);
}

const suggestSimilarTasksPrompt = ai.definePrompt({
  name: 'suggestSimilarTasksPrompt',
  input: {schema: SuggestSimilarTasksInputSchema},
  output: {schema: SuggestSimilarTasksOutputSchema},
  prompt: `Given the following task title and description, suggest up to 3 similar tasks:

Task Title: {{{title}}}
Task Description: {{{description}}}

Suggestions:`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const suggestSimilarTasksFlow = ai.defineFlow(
  {
    name: 'suggestSimilarTasksFlow',
    inputSchema: SuggestSimilarTasksInputSchema,
    outputSchema: SuggestSimilarTasksOutputSchema,
  },
  async input => {
    const {output} = await suggestSimilarTasksPrompt(input);
    return output!;
  }
);
