import { allRoutes } from '../src/routes.js';
import { allAnnouncements } from '../src/announcements.js';
import { OPEN_AUTH_ROUTES } from '../src/modules/core/signin/open-routes.js';

const routes = allRoutes.map((r) => ({
  operationId: r.operationId,
  method: r.method,
  path: r.path,
  module: r.module,
  public: r.public,
  permission: r.public ? null : (r.permission ?? null),
  feature: r.public ? null : (r.feature ?? null),
}));

const announcements = allAnnouncements.map((a) => ({
  name: a.name,
  module: a.module,
}));

const output = {
  routes,
  authRoutes: [...OPEN_AUTH_ROUTES],
  announcements,
};

console.log(JSON.stringify(output, null, 2));
