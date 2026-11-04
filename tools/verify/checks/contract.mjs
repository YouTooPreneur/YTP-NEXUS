const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']);

export function compareRoutesToContracts(routes = [], openapi = {}) {
  const problems = [];
  const routeMap = new Map();

  for (const r of routes) {
    const method = (r.method || '').toLowerCase();
    const key = `${method} ${r.path}`;
    routeMap.set(key, {
      method,
      path: r.path,
      operationId: r.operationId,
    });
  }

  const contractMap = new Map();
  const paths = openapi?.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const [methodKey, details] of Object.entries(methods)) {
      const method = methodKey.toLowerCase();
      if (!HTTP_METHODS.has(method)) continue;
      const key = `${method} ${path}`;
      contractMap.set(key, {
        method,
        path,
        operationId: details?.operationId || '',
      });
    }
  }

  for (const [key, r] of routeMap.entries()) {
    const c = contractMap.get(key);
    if (!c || c.operationId !== r.operationId) {
      problems.push(`route without contract: ${r.method} ${r.path} ${r.operationId}`);
    }
  }

  for (const [key, c] of contractMap.entries()) {
    const r = routeMap.get(key);
    if (!r || r.operationId !== c.operationId) {
      problems.push(`contract without route: ${c.method} ${c.path} ${c.operationId}`);
    }
  }

  return problems.sort();
}
