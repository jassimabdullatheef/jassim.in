import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { OPENROUTER_API_KEY } from "$env/static/private";

// Define the schema for task structure - matches TaskForm.svelte field values
const TaskSchema = z.object({
  name: z.string().describe("The name of the task"),
  duration: z
    .number()
    .default(30)
    .describe("Duration in minutes (default: 30)"),
  bufferBefore: z
    .number()
    .default(0)
    .describe("Buffer time before task in minutes"),
  bufferAfter: z
    .number()
    .default(0)
    .describe("Buffer time after task in minutes"),
  preference: z
    .enum(["morning", "any time", "afternoon", "evening"])
    .default("any time")
    .describe(
      "Preferred time of day - must be one of: morning, any time, afternoon, evening"
    ),
  category: z
    .enum(["work", "personal"])
    .default("work")
    .describe('Task category - must be either "work" or "personal"'),
});

const TasksResponseSchema = z.object({
  tasks: z.array(TaskSchema).describe("Array of structured tasks"),
});

/**
 * AI Agent that processes a text block and extracts structured task data
 * @param {string} text - Text block containing task descriptions
 * @returns {Promise<{tasks: Array<{name: string, duration: number, bufferBefore: number, bufferAfter: number, preference: string, category: string}>}>}
 */
export async function processTasks(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return { tasks: [] };
  }

  // Check for API key
  const apiKey = OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  // Initialize OpenRouter provider
  const openrouter = createOpenRouter({
    apiKey: apiKey,
  });

  // Create the prompt
  const prompt = `You are a task planning assistant. Analyze the following text and extract all tasks mentioned. Break down the text into individual, actionable tasks with appropriate properties.

Text to analyze:
${text}

Your task:
1. Read and understand the entire text
2. Identify all tasks, activities, or work items mentioned
3. Break down complex tasks into smaller, actionable items if needed
4. Extract or infer task details from context

For each task you identify, determine:
1. **Task name**: A clear, concise name for the task (extract from text or infer from context)
2. **Duration**: Estimate in minutes (default to 30 minutes if not specified, but estimate realistically based on task type and context)
3. **Buffer before**: Minutes needed before the task (e.g., preparation, setup, travel time)
4. **Buffer after**: Minutes needed after the task (e.g., cleanup, documentation, transition)
5. **Preferred time**: Must be exactly one of: "morning", "any time", "afternoon", or "evening" (infer from context, task nature, or explicit mentions)
6. **Category**: Must be exactly "work" or "personal" (classify based on task type and context)

Guidelines:
- If the text mentions time preferences (e.g., "morning routine", "after work"), use that context
- If tasks are grouped or related, break them into separate tasks
- If duration is mentioned (e.g., "1 hour meeting", "30 min workout"), use that
- If tasks require preparation or follow-up, add appropriate buffer times
- Meetings typically need 5-10 min buffer before and after
- Exercise/routine tasks often prefer morning
- Deep work tasks can be any time but may need longer durations
- Personal tasks like reading, meditation often prefer evening or morning

Examples of text analysis:
- "I need to exercise in the morning, then have a team meeting at 2pm, and finish my project report" 
  → Extract: Exercise (morning, 30-60min, personal), Team Meeting (afternoon, 30-60min, work, buffers), Project Report (any time, 60-120min, work)

- "Morning routine: meditation for 15 minutes, then breakfast and emails. Afternoon: client call and finish the presentation"
  → Extract: Meditation (morning, 15min, personal), Breakfast (morning, 15-30min, personal), Emails (morning, 15-30min, work), Client Call (afternoon, 30-60min, work, buffers), Presentation (afternoon, 60-120min, work)

Return all extracted tasks in a structured JSON format.`;

  try {
    // Create a timeout promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timeout: The task processing took longer than 30 seconds. Please try again with a shorter description."));
      }, 30000); // 30 seconds
    });

    // Race between the generateObject call and the timeout
    const result = await Promise.race([
      generateObject({
        model: openrouter.chat("openai/gpt-oss-20b:free"),
        schema: TasksResponseSchema,
        prompt: prompt,
      }),
      timeoutPromise
    ]);

    return result.object;
  } catch (error) {
    console.error("Error processing tasks with AI:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process tasks: ${errorMessage}`);
  }
}
