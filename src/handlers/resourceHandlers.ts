import { dbAll, getListTablesQuery, getDescribeTableQuery, listRegisteredDatabases } from '../db/index.js';

/**
 * Handle listing resources request.
 * Iterates all registered databases and lists table schemas for each.
 */
export async function handleListResources() {
  try {
    const databases = listRegisteredDatabases();
    const allResources: any[] = [];

    for (const db of databases) {
      try {
        const query = getListTablesQuery(db.name);
        const tables = await dbAll(query, [], db.name);

        for (const row of tables) {
          allResources.push({
            uri: `db://${db.name}/${row.name}/schema`,
            mimeType: "application/json",
            name: `"${row.name}" schema (${db.name})`,
          });
        }
      } catch {
        // Skip databases that fail to list tables (e.g. connection issues)
      }
    }

    return { resources: allResources };
  } catch (error: any) {
    throw new Error(`Error listing resources: ${error.message}`);
  }
}

/**
 * Handle reading a specific resource.
 * URI format: db://{dbName}/{tableName}/schema
 */
export async function handleReadResource(uri: string) {
  try {
    const resourceUrl = new URL(uri);
    const SCHEMA_PATH = "schema";

    // Parse db name from host and table name from path
    const dbName = resourceUrl.hostname;
    const pathComponents = resourceUrl.pathname.split("/").filter(Boolean);

    if (pathComponents.length < 2 || pathComponents[pathComponents.length - 1] !== SCHEMA_PATH) {
      throw new Error("Invalid resource URI");
    }

    const tableName = pathComponents[pathComponents.length - 2];

    const query = getDescribeTableQuery(tableName, dbName);
    const result = await dbAll(query, [], dbName);

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(result.map((column: any) => ({
            column_name: column.name,
            data_type: column.type
          })), null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Error reading resource: ${error.message}`);
  }
}
