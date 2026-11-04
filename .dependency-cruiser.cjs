module.exports = {
  forbidden: [
    {
      name: 'frontend-never-imports-backend',
      severity: 'error',
      from: {
        path: '^(apps/web|packages/(ui|contracts))/',
      },
      to: {
        path: '^apps/api/',
      },
    },
    {
      name: 'frontend-no-server-packages',
      severity: 'error',
      from: {
        path: '^(apps/web|packages/(ui|contracts))/',
      },
      to: {
        path: '^(pg|drizzle-orm|pg-boss|nodemailer|express)(/|$)|^better-auth(/(?!client|react)|$)|node_modules/(pg|drizzle-orm|pg-boss|nodemailer|express)/|node_modules/better-auth/(?!dist/client|react)',
      },
    },
    {
      name: 'module-walls',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/([^/]+)/',
      },
      to: {
        path: '^apps/api/src/modules/[^/]+/',
        pathNot: '^apps/api/src/modules/($1)/|^apps/api/src/modules/[^/]+/index\\.ts$',
      },
    },
    {
      name: 'core-asks-no-module',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/core/',
      },
      to: {
        path: '^apps/api/src/modules/(?!core/)[^/]+/',
      },
    },
    {
      name: 'floor-rules-crm',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/crm/',
      },
      to: {
        path: '^apps/api/src/modules/(team|webcare|finance|contracts|projects|academy)/',
      },
    },
    {
      name: 'floor-rules-team',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/team/',
      },
      to: {
        path: '^apps/api/src/modules/(crm|webcare|finance|contracts|projects|academy)/',
      },
    },
    {
      name: 'floor-rules-webcare',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/webcare/',
      },
      to: {
        path: '^apps/api/src/modules/(finance|contracts|projects|academy)/',
      },
    },
    {
      name: 'floor-rules-finance',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/finance/',
      },
      to: {
        path: '^apps/api/src/modules/(webcare|contracts|projects|academy)/',
      },
    },
    {
      name: 'floor-rules-contracts',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/contracts/',
      },
      to: {
        path: '^apps/api/src/modules/(projects|academy)/',
      },
    },
    {
      name: 'floor-rules-projects',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/projects/',
      },
      to: {
        path: '^apps/api/src/modules/(academy)/',
      },
    },
    {
      name: 'floor-rules-academy',
      severity: 'error',
      from: {
        path: '^apps/api/src/modules/academy/',
      },
      to: {
        path: '^apps/api/src/modules/(webcare|contracts|projects)/',
      },
    },
    {
      name: 'auth-schema-wall',
      severity: 'error',
      from: {
        path: '^apps/api/src/',
        pathNot: '^apps/api/src/(modules/core/(signin|users)/|db/)',
      },
      to: {
        path: '^apps/api/src/db/auth-schema\\.ts$',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    doNotFollow: 'node_modules',
    exclude: '^(apps|packages)/[^/]+/(dist|test)/',
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.json'],
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
