import { dbAll, dbExec, getListTablesQuery, getDescribeTableQuery } from '../db/index.js';
import { formatSuccessResponse } from '../utils/formatUtils.js';

/**
 * Create a new table in the database
 */
export async function createTable(query: string, dbName?: string) {
  try {
    if (!query.trim().toLowerCase().startsWith("create table")) {
      throw new Error("Only CREATE TABLE statements are allowed");
    }

    await dbExec(query, dbName);
    return formatSuccessResponse({ success: true, message: "Table created successfully" });
  } catch (error: any) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

/**
 * Alter an existing table schema
 */
export async function alterTable(query: string, dbName?: string) {
  try {
    if (!query.trim().toLowerCase().startsWith("alter table")) {
      throw new Error("Only ALTER TABLE statements are allowed");
    }

    await dbExec(query, dbName);
    return formatSuccessResponse({ success: true, message: "Table altered successfully" });
  } catch (error: any) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

/**
 * Drop a table from the database
 */
export async function dropTable(tableName: string, confirm: boolean, dbName?: string) {
  try {
    if (!tableName) {
      throw new Error("Table name is required");
    }

    if (!confirm) {
      return formatSuccessResponse({
        success: false,
        message: "Safety confirmation required. Set confirm=true to proceed with dropping the table."
      });
    }

    const query = getListTablesQuery(dbName);
    const tables = await dbAll(query, [], dbName);
    const tableNames = tables.map(t => t.name);

    if (!tableNames.includes(tableName)) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    await dbExec(`DROP TABLE "${tableName}"`, dbName);

    return formatSuccessResponse({
      success: true,
      message: `Table '${tableName}' dropped successfully`
    });
  } catch (error: any) {
    throw new Error(`Error dropping table: ${error.message}`);
  }
}

/**
 * List all tables in the database
 */
export async function listTables(dbName?: string) {
  try {
    const query = getListTablesQuery(dbName);
    const tables = await dbAll(query, [], dbName);
    return formatSuccessResponse(tables.map((t) => t.name));
  } catch (error: any) {
    throw new Error(`Error listing tables: ${error.message}`);
  }
}

/**
 * Get schema information for a specific table
 */
export async function describeTable(tableName: string, dbName?: string) {
  try {
    if (!tableName) {
      throw new Error("Table name is required");
    }

    const query = getListTablesQuery(dbName);
    const tables = await dbAll(query, [], dbName);
    const tableNames = tables.map(t => t.name);

    if (!tableNames.includes(tableName)) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    const descQuery = getDescribeTableQuery(tableName, dbName);
    const columns = await dbAll(descQuery, [], dbName);

    return formatSuccessResponse(columns.map((col) => ({
      name: col.name,
      type: col.type,
      notnull: !!col.notnull,
      default_value: col.dflt_value,
      primary_key: !!col.pk
    })));
  } catch (error: any) {
    throw new Error(`Error describing table: ${error.message}`);
  }
}
