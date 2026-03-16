# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) database server that exposes database access as tools over stdio transport. Supports SQLite, SQL Server, PostgreSQL, and MySQL. Published as `@executeautomation/database-server` on npm.

## Build & Dev Commands

```bash
npm run build      # Compile TypeScript and chmod the entry point
npm run dev        # Build + run the server (needs DB args, see below)
npm run watch      # Incremental TypeScript compilation on file changes
npm run clean      # Remove dist/ directory
npm run start      # Run compiled server (needs DB args)
```

There is no test framework or linter configured in this project.

### Running the server locally

```bash
# SQLite
node dist/src/index.js /path/to/database.db

# SQL Server
node dist/src/index.js --sqlserver --server <host> --database <db> [--user <u> --password <p>]

# PostgreSQL
node dist/src/index.js --postgresql --host <host> --database <db> [--user <u> --password <p>]

# MySQL
node dist/src/index.js --mysql --host <host> --database <db> [--user <u> --password <p> --port <port>]

# MySQL with AWS IAM
node dist/src/index.js --mysql --aws-iam-auth --host <rds-endpoint> --database <db> --user <u> --aws-region <region>
```

## Architecture

### Entry Points

- **`src/index.ts`** - Main entry point. Parses CLI args, creates the MCP `Server`, wires up request handlers, and initializes the database connection. Compiled to `dist/src/index.js`.
- **`index.ts` (root)** - Legacy standalone SQLite-only implementation. **Not compiled** by tsconfig (which only includes `./src/**/*.ts`). Kept for reference but not used.

### Layered Structure

```
src/index.ts (CLI parsing + MCP server setup)
  -> src/handlers/ (MCP request routing)
       -> toolHandlers.ts   - routes CallToolRequest to tool implementations
       -> resourceHandlers.ts - handles ListResources/ReadResource for table schemas
  -> src/tools/ (business logic for each MCP tool)
       -> queryTools.ts  - read_query, write_query, export_query
       -> schemaTools.ts - create_table, alter_table, drop_table, list_tables, describe_table
       -> insightTools.ts - append_insight, list_insights
  -> src/db/ (database abstraction layer)
       -> adapter.ts - DbAdapter interface + createDbAdapter() factory
       -> index.ts   - singleton module holding the active adapter; exports dbAll/dbRun/dbExec
       -> sqlite-adapter.ts, sqlserver-adapter.ts, postgresql-adapter.ts, mysql-adapter.ts
  -> src/utils/
       -> formatUtils.ts - CSV conversion, formatErrorResponse, formatSuccessResponse
```

### Database Adapter Pattern

All database backends implement the `DbAdapter` interface (`src/db/adapter.ts`): `init()`, `close()`, `all()`, `run()`, `exec()`, `getMetadata()`, `getListTablesQuery()`, `getDescribeTableQuery()`. The factory function `createDbAdapter(type, connectionInfo)` instantiates the correct adapter.

`src/db/index.ts` acts as a singleton: it holds the active `DbAdapter` instance and re-exports convenience functions (`dbAll`, `dbRun`, `dbExec`, etc.) that all tool implementations call. The adapter is set once during `initDatabase()`.

## Key Conventions

- **ESM modules**: `"type": "module"` in package.json with `"module": "NodeNext"` in tsconfig. All TypeScript imports must use `.js` extension (e.g., `import { foo } from './bar.js'`).
- **Logging to stderr**: stdout is reserved for the MCP stdio transport. The custom `logger` in `src/index.ts` routes all output through `console.error`.
- **TypeScript strict mode**: `"strict": true` in tsconfig, targeting ES2020.
- **CLI arg parsing**: Manual parsing in `src/index.ts` with no external library. Database type is determined by flag (`--sqlserver`, `--postgresql`, `--mysql`), defaulting to SQLite.
- **`global.d.ts`**: Custom type declarations for the `sqlite3` module at the project root.

## Adding a New Database Backend

1. Create `src/db/<name>-adapter.ts` implementing the `DbAdapter` interface.
2. Import it in `src/db/adapter.ts` and add a case to `createDbAdapter()`.
3. Add CLI arg parsing for the new backend in `src/index.ts`.
