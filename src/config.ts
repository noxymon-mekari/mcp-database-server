import { readFileSync } from 'fs';

export interface DatabaseConfig {
  name: string;
  type: string;
  path?: string;
  host?: string;
  server?: string;
  database?: string;
  user?: string;
  password?: string;
  port?: number;
  ssl?: boolean | string;
  connectionTimeout?: number;
  awsIamAuth?: boolean;
  awsRegion?: string;
}

export interface MultiDbConfig {
  databases: DatabaseConfig[];
}

const VALID_TYPES = new Set(['sqlite', 'sqlserver', 'postgresql', 'postgres', 'mysql']);

export function validateDatabaseConfig(db: DatabaseConfig, index: number): void {
  if (!db.name || typeof db.name !== 'string') {
    throw new Error(`databases[${index}]: "name" is required and must be a string`);
  }

  if (!db.type || !VALID_TYPES.has(db.type.toLowerCase())) {
    throw new Error(`databases[${index}] ("${db.name}"): "type" must be one of: sqlite, sqlserver, postgresql, mysql`);
  }

  const type = db.type.toLowerCase();

  if (type === 'sqlite') {
    if (!db.path) {
      throw new Error(`databases[${index}] ("${db.name}"): sqlite requires "path"`);
    }
  } else if (type === 'sqlserver') {
    if (!db.server || !db.database) {
      throw new Error(`databases[${index}] ("${db.name}"): sqlserver requires "server" and "database"`);
    }
  } else if (type === 'postgresql' || type === 'postgres') {
    if (!db.host || !db.database) {
      throw new Error(`databases[${index}] ("${db.name}"): postgresql requires "host" and "database"`);
    }
  } else if (type === 'mysql') {
    if (!db.host || !db.database) {
      throw new Error(`databases[${index}] ("${db.name}"): mysql requires "host" and "database"`);
    }
    if (db.awsIamAuth) {
      if (!db.user) {
        throw new Error(`databases[${index}] ("${db.name}"): AWS IAM authentication requires "user"`);
      }
      if (!db.awsRegion) {
        throw new Error(`databases[${index}] ("${db.name}"): AWS IAM authentication requires "awsRegion"`);
      }
    }
  }
}

export function configToConnectionInfo(db: DatabaseConfig): { dbType: string; connectionInfo: any } {
  const type = db.type.toLowerCase();

  if (type === 'sqlite') {
    return { dbType: 'sqlite', connectionInfo: db.path };
  }

  if (type === 'sqlserver') {
    return {
      dbType: 'sqlserver',
      connectionInfo: {
        server: db.server,
        database: db.database,
        user: db.user,
        password: db.password,
        port: db.port,
      },
    };
  }

  if (type === 'postgresql' || type === 'postgres') {
    return {
      dbType: 'postgresql',
      connectionInfo: {
        host: db.host,
        database: db.database,
        user: db.user,
        password: db.password,
        port: db.port,
        ssl: db.ssl,
        connectionTimeout: db.connectionTimeout,
      },
    };
  }

  // mysql
  const connectionInfo: any = {
    host: db.host,
    database: db.database,
    user: db.user,
    password: db.password,
    port: db.port,
    ssl: db.awsIamAuth ? true : db.ssl,
    connectionTimeout: db.connectionTimeout,
    awsIamAuth: db.awsIamAuth || false,
    awsRegion: db.awsRegion,
  };
  return { dbType: 'mysql', connectionInfo };
}

/**
 * Parse and validate a JSON string as MultiDbConfig
 */
export function parseConfig(raw: string, source: string = 'config'): MultiDbConfig {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ${source}: ${(err as Error).message}`);
  }

  if (!parsed.databases || !Array.isArray(parsed.databases)) {
    throw new Error(`${source} must contain a "databases" array`);
  }

  if (parsed.databases.length === 0) {
    throw new Error(`${source}: "databases" array must not be empty`);
  }

  const names = new Set<string>();
  for (let i = 0; i < parsed.databases.length; i++) {
    validateDatabaseConfig(parsed.databases[i], i);
    const name = parsed.databases[i].name;
    if (names.has(name)) {
      throw new Error(`Duplicate database name: "${name}"`);
    }
    names.add(name);
  }

  return parsed as MultiDbConfig;
}

/**
 * Load config from a file path or inline JSON string.
 * Auto-detects: if value starts with '{', treats as JSON; otherwise reads as file.
 */
export function loadConfig(filePathOrJson: string): MultiDbConfig {
  if (filePathOrJson.trimStart().startsWith('{')) {
    return parseConfig(filePathOrJson, 'inline JSON config');
  }

  let raw: string;
  try {
    raw = readFileSync(filePathOrJson, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read config file "${filePathOrJson}": ${(err as Error).message}`);
  }

  return parseConfig(raw, `config file "${filePathOrJson}"`);
}

/**
 * Load config from an environment variable by name.
 */
export function loadConfigFromEnv(envVarName: string): MultiDbConfig {
  const value = process.env[envVarName];
  if (!value) {
    throw new Error(`Environment variable "${envVarName}" is not set or empty`);
  }
  return parseConfig(value, `environment variable "${envVarName}"`);
}
