import { allRoutes } from '../src/routes.js';
import { allAnnouncements } from '../src/announcements.js';

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
  authRoutes: [],
  announcements,
};

console.log(JSON.stringify(output, null, 2));
