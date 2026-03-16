import { listRegisteredDatabases } from '../db/index.js';
import { formatSuccessResponse } from '../utils/formatUtils.js';

/**
 * List all configured database connections
 */
export async function listDatabases() {
  const databases = listRegisteredDatabases();
  return formatSuccessResponse(databases);
}
