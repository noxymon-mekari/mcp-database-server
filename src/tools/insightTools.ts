import { formatSuccessResponse } from '../utils/formatUtils.js';

// In-memory insight storage (database-agnostic, works with any DB type)
const insights: Array<{ id: number; insight: string; created_at: string }> = [];
let nextId = 1;

/**
 * Add a business insight to the memo
 */
export async function appendInsight(insight: string) {
  try {
    if (!insight) {
      throw new Error("Insight text is required");
    }

    insights.push({
      id: nextId++,
      insight,
      created_at: new Date().toISOString(),
    });

    return formatSuccessResponse({ success: true, message: "Insight added" });
  } catch (error: any) {
    throw new Error(`Error adding insight: ${error.message}`);
  }
}

/**
 * List all insights in the memo
 */
export async function listInsights() {
  try {
    return formatSuccessResponse([...insights].reverse());
  } catch (error: any) {
    throw new Error(`Error listing insights: ${error.message}`);
  }
}
