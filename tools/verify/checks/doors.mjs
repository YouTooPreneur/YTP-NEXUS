export function checkDoors({ routes = [], authRoutes = [], allowedAuthRoutes = [] } = {}) {
  const problems = [];

  for (const r of routes) {
    if (!r.public) {
      if (!r.permission || !r.feature) {
        problems.push(`door without permission or feature: ${r.operationId}`);
      }
    }
  }

  if (Array.isArray(authRoutes) && authRoutes.length > 0) {
    const allowedSet = new Set(allowedAuthRoutes);
    const authSet = new Set(authRoutes);

    for (const route of authSet) {
      if (!allowedSet.has(route)) {
        problems.push(`sign-in door not on the list: ${route}`);
      }
    }

    for (const allowed of allowedSet) {
      if (!authSet.has(allowed)) {
        problems.push(`sign-in door on the list but missing: ${allowed}`);
      }
    }
  }

  return problems.sort();
}
