import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { env } from "$env/dynamic/private";

// Schema for a scheduled task block
const ScheduledBlockSchema = z.object({
  taskId: z.string().describe("The ID of the task to schedule"),
  startHour: z
    .number()
    .min(0)
    .max(24)
    .describe("Start time in hours (0-24, e.g., 9.5 for 9:30 AM)"),
  duration: z
    .number()
    .min(0.01)
    .describe(
      "Duration in hours (must be at least 0.01 hours, e.g., 0.5 for 30 minutes, 1 for 1 hour)"
    ),
});

const ScheduleResponseSchema = z.object({
  scheduledBlocks: z
    .array(ScheduledBlockSchema)
    .describe("Array of scheduled task blocks"),
  unscheduledTasks: z
    .array(z.string())
    .optional()
    .describe("Array of task IDs that couldn't be scheduled"),
});

/**
 * Check if two time blocks overlap
 * @param {{ startHour: number; duration: number }} block1 - Block with startHour and duration
 * @param {{ startHour: number; duration: number }} block2 - Block with startHour and duration
 * @returns {boolean} True if blocks overlap
 */
function blocksOverlap(block1, block2) {
  const block1Start = block1.startHour;
  const block1End = block1Start + block1.duration;
  const block2Start = block2.startHour;
  const block2End = block2Start + block2.duration;

  // Blocks overlap if one starts before the other ends
  return block1Start < block2End && block2Start < block1End;
}

/**
 * Check if a new block overlaps with any existing blocks
 * @param {{ startHour: number; duration: number }} newBlock - New block to check
 * @param {Array<{ startHour: number; duration: number }>} existingBlocks - Array of existing scheduled blocks
 * @returns {boolean} True if newBlock overlaps with any existing block
 */
function hasOverlap(newBlock, existingBlocks) {
  return existingBlocks.some((existingBlock) =>
    blocksOverlap(newBlock, existingBlock)
  );
}

/**
 * AI Agent that schedules tasks within a daily time range based on preferences
 * @param {Array<{id: string; name: string; duration: number; preference?: string; bufferBefore?: number; bufferAfter?: number; color?: string; category?: string}>} tasks - Array of tasks with properties: id, name, duration (minutes), preference, bufferBefore, bufferAfter
 * @param {number} startHour - Start of daily range in hours (0-24)
 * @param {number} endHour - End of daily range in hours (0-24)
 * @param {Array<{startHour: number; duration: number}>} existingScheduledBlocks - Optional array of already scheduled blocks to avoid overlaps
 * @returns {Promise<{scheduledBlocks: Array<{taskId: string; startHour: number; duration: number}>, unscheduledTasks?: Array<string>, overlappingTasks?: Array<string>}>}
 */
export async function scheduleTasks(
  tasks,
  startHour,
  endHour,
  existingScheduledBlocks = []
) {
  if (!tasks || tasks.length === 0) {
    return { scheduledBlocks: [], unscheduledTasks: [] };
  }

  if (
    startHour < 0 ||
    startHour >= 24 ||
    endHour <= 0 ||
    endHour > 24 ||
    startHour >= endHour
  ) {
    throw new Error(
      "Invalid time range. Start hour must be between 0-24, end hour must be between 0-24, and start must be less than end."
    );
  }

  // Filter out tasks with invalid durations (must be > 0)
  const validTasks = tasks.filter((task) => {
    const duration = task.duration || 0;
    return duration > 0;
  });

  if (validTasks.length === 0) {
    return { scheduledBlocks: [], unscheduledTasks: tasks.map((t) => t.id) };
  }

  // Track which tasks were filtered out
  const invalidTaskIds = tasks
    .filter((task) => {
      const duration = task.duration || 0;
      return duration <= 0;
    })
    .map((t) => t.id);

  // Check for API key
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  // Initialize OpenRouter provider
  const openrouter = createOpenRouter({
    apiKey: apiKey,
  });

  // Convert task durations from minutes to hours for the prompt
  const tasksInfo = validTasks.map((task) => ({
    id: task.id,
    name: task.name,
    durationMinutes: task.duration,
    durationHours: (task.duration / 60).toFixed(2),
    bufferBefore: task.bufferBefore || 0,
    bufferAfter: task.bufferAfter || 0,
    preference: task.preference || "any time",
    category: task.color || task.category || "work",
  }));

  const availableHours = endHour - startHour;
  const totalTaskTime = validTasks.reduce((sum, task) => {
    const taskHours =
      (task.duration + (task.bufferBefore || 0) + (task.bufferAfter || 0)) / 60;
    return sum + taskHours;
  }, 0);

  // Create the prompt
  const prompt = `You are a task scheduling assistant. Schedule the following tasks within the daily time range based on their preferences and constraints.

Daily Time Range: ${startHour}:00 to ${endHour}:00 (${availableHours} hours available)
Total task time needed: ${totalTaskTime.toFixed(2)} hours

Tasks to schedule:
${tasksInfo
  .map(
    (task, index) => `
${index + 1}. Task ID: ${task.id}
   Name: ${task.name}
   Duration: ${task.durationMinutes} minutes (${task.durationHours} hours)
   Buffer before: ${task.bufferBefore} minutes
   Buffer after: ${task.bufferAfter} minutes
   Preferred time: ${task.preference}
   Category: ${task.category}
`
  )
  .join("")}

Scheduling Rules:
1. **Respect time preferences**: 
   - "morning" = schedule between ${Math.max(startHour, 6)}:00 - 12:00
   - "afternoon" = schedule between 12:00 - 17:00
   - "evening" = schedule between 17:00 - ${Math.min(endHour, 22)}:00
   - "any time" = can be scheduled anywhere in the available range

2. **Include buffer times**: When scheduling, account for bufferBefore and bufferAfter
   - Total time slot = duration + bufferBefore + bufferAfter
   - The startHour should account for bufferBefore (task starts at startHour + bufferBefore/60)
   - The duration in the schedule should be the actual task duration (not including buffers)

3. **Time constraints**:
   - **CRITICAL**: All tasks MUST be scheduled completely within the time range ${startHour}:00 - ${endHour}:00
   - The task startHour must be >= ${startHour} and the task end time (startHour + duration) must be <= ${endHour}
   - If a task cannot fit completely within this range, DO NOT schedule it - add it to unscheduledTasks instead
   - Tasks cannot overlap
   - Start times should be in hours (e.g., 9.5 for 9:30 AM, 14.25 for 2:15 PM)
   - Duration should be in hours (e.g., 0.5 for 30 minutes, 1.5 for 1.5 hours)

4. **Optimization**:
   - Try to schedule tasks close to their preferred times
   - Group similar tasks together when possible
   - Leave some gaps between tasks for flexibility
   - If tasks don't fit, prioritize by preference strength (morning > afternoon > evening > any time)

5. **Output format**:
   - For each scheduled task, provide: taskId, startHour (in hours, decimal), duration (in hours, decimal)
   - startHour is when the task itself starts (after bufferBefore)
   - duration is the task duration only (not including buffers)
   - **IMPORTANT**: duration MUST be greater than 0. Never schedule a task with duration 0. If a task cannot be scheduled, include it in unscheduledTasks instead.

Example:
- Task: "Exercise" (30 min, bufferBefore: 0, bufferAfter: 15, preference: "morning")
  - If scheduled at 7:00 AM: startHour = 7.0, duration = 0.5
  - Buffer after is handled by the next task's bufferBefore

Return the scheduled blocks. If some tasks cannot be scheduled within the time range, list their IDs in unscheduledTasks.`;

  try {
    // Create a timeout promise that rejects after 1 minute
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Request timeout: The task scheduling took longer than 1 minute. Please try again."
          )
        );
      }, 60000); // 60 seconds (1 minute)
    });

    console.log("Prompt:", prompt);

    // Race between the generateObject call and the timeout
    const result = await Promise.race([
      generateObject({
        model: openrouter.chat("openai/gpt-oss-20b:free"),
        schema: ScheduleResponseSchema,
        prompt: prompt,
      }),
      timeoutPromise,
    ]);

    // Validate and filter out any blocks with invalid durations (shouldn't happen, but safety check)
    const validatedBlocks = result.object.scheduledBlocks.filter(
      (block) => block.duration > 0
    );
    const invalidBlockTaskIds = result.object.scheduledBlocks
      .filter((block) => block.duration <= 0)
      .map((block) => block.taskId);

    // Filter out blocks that overlap with existing scheduled blocks
    const nonOverlappingBlocks = [];
    const overlappingTaskIds = [];

    for (const block of validatedBlocks) {
      if (hasOverlap(block, existingScheduledBlocks)) {
        overlappingTaskIds.push(block.taskId);
      } else {
        nonOverlappingBlocks.push(block);
      }
    }

    // Filter out blocks that fall outside the time range
    const withinRangeBlocks = [];
    const outOfRangeTaskIds = [];

    for (const block of nonOverlappingBlocks) {
      const blockStart = block.startHour;
      const blockEnd = blockStart + block.duration;

      // Check if block is completely within the time range
      if (blockStart >= startHour && blockEnd <= endHour) {
        withinRangeBlocks.push(block);
      } else {
        // Block is outside the time range
        outOfRangeTaskIds.push(block.taskId);
      }
    }

    // Combine invalid task IDs from validation and from the AI response
    const allUnscheduledTasks = [
      ...(result.object.unscheduledTasks || []),
      ...invalidTaskIds,
      ...invalidBlockTaskIds,
      ...outOfRangeTaskIds,
    ];

    return {
      scheduledBlocks: withinRangeBlocks,
      unscheduledTasks:
        allUnscheduledTasks.length > 0 ? allUnscheduledTasks : undefined,
      overlappingTasks:
        overlappingTaskIds.length > 0 ? overlappingTaskIds : undefined,
    };
  } catch (error) {
    console.error("Error scheduling tasks with AI:", error);

    // Check if this is a validation error related to duration
    if (error && typeof error === "object" && "cause" in error) {
      const cause = error.cause;
      if (cause && typeof cause === "object" && "cause" in cause) {
        const nestedCause = cause.cause;
        if (
          nestedCause &&
          typeof nestedCause === "object" &&
          "issues" in nestedCause &&
          Array.isArray(nestedCause.issues)
        ) {
          const durationIssue = nestedCause.issues.find(
            (issue) =>
              issue &&
              typeof issue === "object" &&
              "path" in issue &&
              "code" in issue &&
              Array.isArray(issue.path) &&
              issue.path.includes("duration") &&
              issue.code === "too_small"
          );
          if (durationIssue) {
            throw new Error(
              `Failed to schedule tasks: The AI generated an invalid schedule with zero or negative duration. ` +
                `This may happen if tasks have invalid durations. Please check that all tasks have a duration greater than 0.`
            );
          }
        }
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to schedule tasks: ${errorMessage}`);
  }
}
