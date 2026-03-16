import { formatErrorResponse } from '../utils/formatUtils.js';

// Import all tool implementations
import { readQuery, writeQuery, exportQuery } from '../tools/queryTools.js';
import { createTable, alterTable, dropTable, listTables, describeTable } from '../tools/schemaTools.js';
import { appendInsight, listInsights } from '../tools/insightTools.js';
import { listDatabases } from '../tools/databaseTools.js';

const databaseProperty = {
  type: "string",
  description: "Name of the database to operate on. Required when multiple databases are configured.",
};

/**
 * Handle listing available tools
 */
export function handleListTools() {
  return {
    tools: [
      {
        name: "list_databases",
        description: "List all configured database connections and their types",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "read_query",
        description: "Execute SELECT queries to read data from the database",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            database: databaseProperty,
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
            database: databaseProperty,
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
            database: databaseProperty,
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
            database: databaseProperty,
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
            database: databaseProperty,
          },
          required: ["table_name", "confirm"],
        },
      },
      {
        name: "export_query",
        description: "Export query results to various formats (CSV, JSON)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            format: { type: "string", enum: ["csv", "json"] },
            database: databaseProperty,
          },
          required: ["query", "format"],
        },
      },
      {
        name: "list_tables",
        description: "Get a list of all tables in the database",
        inputSchema: {
          type: "object",
          properties: {
            database: databaseProperty,
          },
        },
      },
      {
        name: "describe_table",
        description: "View schema information for a specific table",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string" },
            database: databaseProperty,
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
    ],
  };
}

/**
 * Handle tool call requests
 */
export async function handleToolCall(name: string, args: any) {
  try {
    switch (name) {
      case "list_databases":
        return await listDatabases();

      case "read_query":
        return await readQuery(args.query, args.database);

      case "write_query":
        return await writeQuery(args.query, args.database);

      case "create_table":
        return await createTable(args.query, args.database);

      case "alter_table":
        return await alterTable(args.query, args.database);

      case "drop_table":
        return await dropTable(args.table_name, args.confirm, args.database);

      case "export_query":
        return await exportQuery(args.query, args.format, args.database);

      case "list_tables":
        return await listTables(args.database);

      case "describe_table":
        return await describeTable(args.table_name, args.database);

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
