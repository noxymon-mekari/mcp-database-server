import { formatErrorResponse } from '../utils/formatUtils.js';

// Import all tool implementations
import { readQuery, writeQuery, exportQuery } from '../tools/queryTools.js';
import { createTable, alterTable, dropTable, listTables, describeTable } from '../tools/schemaTools.js';
import { appendInsight, listInsights } from '../tools/insightTools.js';

/**
 * Tools that perform write operations on the database.
 * These are hidden and blocked when the server runs in readonly mode.
 */
const WRITE_TOOLS: ReadonlySet<string> = new Set([
  "write_query",
  "create_table",
  "alter_table",
  "drop_table",
  "append_insight",
]);

/**
 * Handle listing available tools
 * @param readonly Whether the server is in readonly mode
 * @returns List of available tools
 */
export function handleListTools(readonly: boolean = false) {
  const allTools = [
      {
        name: "read_query",
        description: "Execute read-only queries (SELECT, EXPLAIN, WITH, PRAGMA, SHOW, DESCRIBE) to read data from the database",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
      {
        name: "write_query",
        description: "Execute INSERT, UPDATE, or DELETE queries",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
      {
        name: "create_table",
        description: "Create new tables in the database",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
      {
        name: "alter_table",
        description: "Modify existing table schema (add columns, rename tables, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
      {
        name: "drop_table",
        description: "Remove a table from the database with safety confirmation",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string" },
            confirm: { type: "boolean" },
          },
          required: ["table_name", "confirm"],
        },
      },
      {
        name: "export_query",
        description: "Export read-only query results (SELECT, EXPLAIN, WITH, PRAGMA, SHOW, DESCRIBE) to various formats (CSV, JSON)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            format: { type: "string", enum: ["csv", "json"] },
          },
          required: ["query", "format"],
        },
      },
      {
        name: "list_tables",
        description: "Get a list of all tables in the database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "describe_table",
        description: "View schema information for a specific table",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string" },
          },
          required: ["table_name"],
        },
      },
      {
        name: "append_insight",
        description: "Add a business insight to the memo",
        inputSchema: {
          type: "object",
          properties: {
            insight: { type: "string" },
          },
          required: ["insight"],
        },
      },
      {
        name: "list_insights",
        description: "List all business insights in the memo",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
  ];

  const tools = readonly
    ? allTools.filter(tool => !WRITE_TOOLS.has(tool.name))
    : allTools;

  return { tools };
}

/**
 * Handle tool call requests
 * @param name Name of the tool to call
 * @param args Arguments for the tool
 * @param readonly Whether the server is in readonly mode
 * @returns Tool execution result
 */
export async function handleToolCall(name: string, args: any, readonly: boolean = false) {
  try {
    if (readonly && WRITE_TOOLS.has(name)) {
      return formatErrorResponse(
        `Tool "${name}" is disabled in readonly mode. The server was started with --readonly, which prevents all write operations.`
      );
    }

    switch (name) {
      case "read_query":
        return await readQuery(args.query);
      
      case "write_query":
        return await writeQuery(args.query);
      
      case "create_table":
        return await createTable(args.query);
      
      case "alter_table":
        return await alterTable(args.query);
      
      case "drop_table":
        return await dropTable(args.table_name, args.confirm);
      
      case "export_query":
        return await exportQuery(args.query, args.format);
      
      case "list_tables":
        return await listTables();
      
      case "describe_table":
        return await describeTable(args.table_name);
      
      case "append_insight":
        return await appendInsight(args.insight);
      
      case "list_insights":
        return await listInsights();
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return formatErrorResponse(error);
  }
} 