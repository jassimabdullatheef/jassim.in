import { json } from "@sveltejs/kit";
import { processTasks } from "../../agent.js";

/**
 * POST endpoint to process a text block and extract structured task data
 *
 * Request body: { text: string }
 * Response: { tasks: Array<{name, duration, bufferBefore, bufferAfter, preference, category}> }
 */
export async function POST({ request }) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return json(
        { error: "text must be a non-empty string" },
        { status: 400 }
      );
    }

    const result = await processTasks(text);
    return json(result);
  } catch (error) {
    console.error("Error in process-tasks API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process tasks";
    return json({ error: errorMessage }, { status: 500 });
  }
}
