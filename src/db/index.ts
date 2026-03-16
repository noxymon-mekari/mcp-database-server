import { DbAdapter, createDbAdapter } from './adapter.js';
import { DatabaseConfig, configToConnectionInfo } from '../config.js';

// Database adapter registry
const adapters: Map<string, DbAdapter> = new Map();
let defaultDbName: string | null = null;

/**
 * Resolve a database name to a registered adapter name.
 * If only one database is registered and no name is given, returns the default.
 */
export function resolveDbName(dbName?: string): string {
  if (dbName) {
    if (!adapters.has(dbName)) {
      const available = Array.from(adapters.keys()).join(', ');
      throw new Error(`Database "${dbName}" not found. Available databases: ${available}`);
    }
    return dbName;
  }

  if (defaultDbName && adapters.size === 1) {
    return defaultDbName;
  }

  if (adapters.size === 0) {
    throw new Error("No databases initialized");
  }

  const available = Array.from(adapters.keys()).join(', ');
  throw new Error(`"database" parameter is required when multiple databases are configured. Available databases: ${available}`);
}

function getAdapter(dbName?: string): DbAdapter {
  const name = resolveDbName(dbName);
  return adapters.get(name)!;
}

/**
 * Initialize a single database connection and register it
 */
export async function initDatabase(connectionInfo: any, dbType: string = 'sqlite', dbName: string = 'default'): Promise<void> {
  try {
    if (typeof connectionInfo === 'string') {
      connectionInfo = { path: connectionInfo };
    }

    const adapter = createDbAdapter(dbType, connectionInfo);
    await adapter.init();

    adapters.set(dbName, adapter);
    if (!defaultDbName) {
      defaultDbName = dbName;
    }
  } catch (error) {
    throw new Error(`Failed to initialize database "${dbName}": ${(error as Error).message}`);
  }
}

/**
 * Initialize multiple databases from config.
 * Uses Promise.allSettled so partial failures don't block the server.
 */
export async function initAllDatabases(configs: DatabaseConfig[]): Promise<{ successes: string[]; failures: { name: string; error: string }[] }> {
  const results = await Promise.allSettled(
    configs.map(async (cfg) => {
      const { dbType, connectionInfo } = configToConnectionInfo(cfg);
      await initDatabase(connectionInfo, dbType, cfg.name);
      return cfg.name;
    })
  );

  const successes: string[] = [];
  const failures: { name: string; error: string }[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      successes.push(result.value);
    } else {
      failures.push({ name: configs[i].name, error: result.reason?.message || String(result.reason) });
    }
  });

  if (successes.length === 0) {
    throw new Error(`All database connections failed:\n${failures.map(f => `  - ${f.name}: ${f.error}`).join('\n')}`);
  }

  return { successes, failures };
}

/**
 * List all registered databases
 */
export function listRegisteredDatabases(): Array<{ name: string; type: string }> {
  return Array.from(adapters.entries()).map(([name, adapter]) => {
    const meta = adapter.getMetadata();
    return { name, type: meta.type };
  });
}

export function dbAll(query: string, params: any[] = [], dbName?: string): Promise<any[]> {
  return getAdapter(dbName).all(query, params);
}

export function dbRun(query: string, params: any[] = [], dbName?: string): Promise<{ changes: number; lastID: number }> {
  return getAdapter(dbName).run(query, params);
}

export function dbExec(query: string, dbName?: string): Promise<void> {
  return getAdapter(dbName).exec(query);
}

/**
 * Close all database connections
 */
export async function closeDatabase(): Promise<void> {
  const closePromises = Array.from(adapters.values()).map(adapter => adapter.close());
  await Promise.allSettled(closePromises);
  adapters.clear();
  defaultDbName = null;
}

export function getDatabaseMetadata(dbName?: string): { name: string; type: string; path?: string; server?: string; database?: string } {
  return getAdapter(dbName).getMetadata();
}

export function getListTablesQuery(dbName?: string): string {
  return getAdapter(dbName).getListTablesQuery();
}

export function getDescribeTableQuery(tableName: string, dbName?: string): string {
  return getAdapter(dbName).getDescribeTableQuery(tableName);
}
