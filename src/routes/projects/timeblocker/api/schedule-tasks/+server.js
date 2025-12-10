import { json } from "@sveltejs/kit";
import { scheduleTasks } from "../../scheduleAgent.js";

/**
 * POST endpoint to schedule tasks within a daily time range
 *
 * Request body: { tasks: Array, startHour: number, endHour: number, existingScheduledBlocks?: Array }
 * Response: { scheduledBlocks: Array, unscheduledTasks?: Array, overlappingTasks?: Array }
 */
export async function POST({ request }) {
  try {
    const {
      tasks,
      startHour,
      endHour,
      existingScheduledBlocks = [],
    } = await request.json();

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return json(
        { error: "tasks must be a non-empty array" },
        { status: 400 }
      );
    }

    if (typeof startHour !== "number" || typeof endHour !== "number") {
      return json(
        { error: "startHour and endHour must be numbers" },
        { status: 400 }
      );
    }

    if (
      startHour < 0 ||
      startHour >= 24 ||
      endHour <= 0 ||
      endHour > 24 ||
      startHour >= endHour
    ) {
      return json(
        {
          error:
            "Invalid time range. startHour must be 0-24, endHour must be 0-24, and startHour < endHour",
        },
        { status: 400 }
      );
    }

    if (existingScheduledBlocks && !Array.isArray(existingScheduledBlocks)) {
      return json(
        { error: "existingScheduledBlocks must be an array" },
        { status: 400 }
      );
    }

    const result = await scheduleTasks(
      tasks,
      startHour + 1,
      endHour + 1,
      existingScheduledBlocks
    );
    return json(result);
  } catch (error) {
    console.error("Error in schedule-tasks API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to schedule tasks";
    return json({ error: errorMessage }, { status: 500 });
  }
}
