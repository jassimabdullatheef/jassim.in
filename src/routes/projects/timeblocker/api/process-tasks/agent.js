import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { OPENROUTER_API_KEY } from "$env/static/private";

// Define the schema for task structure
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
    .enum(["morning", "afternoon", "evening", "any time"])
    .default("any time")
    .describe("Preferred time of day"),
  color: z.enum(["work", "personal"]).default("work").describe("Task category"),
});

const TasksResponseSchema = z.object({
  tasks: z.array(TaskSchema).describe("Array of structured tasks"),
});

/**
 * AI Agent that processes a list of task names and returns structured task data
 * @param {string[]} taskNames - Array of task names to process
 * @returns {Promise<{tasks: Array<{name: string, duration: number, bufferBefore: number, bufferAfter: number, preference: string, color: string}>}>}
 */
export async function processTasks(taskNames) {
  if (!taskNames || taskNames.length === 0) {
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
  const taskList = taskNames
    .map((name, index) => `${index + 1}. ${name}`)
    .join("\n");
  const prompt = `You are a task planning assistant. Analyze the following list of tasks and return structured information for each task.

Tasks:
${taskList}

For each task, determine:
1. The exact task name (use the provided name)
2. Duration in minutes (default to 30 minutes if not obvious, but estimate realistically based on the task type)
3. Buffer time before the task (in minutes) - consider if the task needs preparation time
4. Buffer time after the task (in minutes) - consider if the task needs cleanup or transition time
5. Preferred time of day: "morning", "afternoon", "evening", or "any time" (choose based on the nature of the task)
6. Category: "work" or "personal" (classify based on the task type)

Examples:
- "Exercise" → morning preference, 30-60 min, personal
- "Deep Work" → any time, 60-120 min, work
- "Meeting" → any time, 30-60 min, work, may need buffer before/after
- "Read Book" → evening, 30-60 min, personal
- "Meditation" → morning, 15-30 min, personal
- "Email" → any time, 15-30 min, work

Return the tasks in a structured JSON format.`;

  try {
    const result = await generateObject({
      model: openrouter.chat("openai/gpt-oss-20b:free"),
      schema: TasksResponseSchema,
      prompt: prompt,
    });

    return result.object;
  } catch (error) {
    console.error("Error processing tasks with AI:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process tasks: ${errorMessage}`);
  }
}
