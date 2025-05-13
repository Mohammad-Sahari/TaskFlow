"use server";

import { suggestSimilarTasks, type SuggestSimilarTasksInput } from '@/ai/flows/suggest-similar-tasks';

export async function getAISuggestions(input: SuggestSimilarTasksInput): Promise<string[]> {
  try {
    const result = await suggestSimilarTasks(input);
    return result.suggestions.slice(0, 3); // Ensure not more than 3 suggestions
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return [];
  }
}
