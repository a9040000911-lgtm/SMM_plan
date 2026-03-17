/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-direct-db-access-from-ui',
      comment: 'UI components should not access the database directly; use services instead.',
      severity: 'error',
      from: { path: '^src/app/(?!api|admin/services/actions)' },
      to: { path: '^src/lib/prisma\\.ts$' }
    },
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      comment: 'Circular dependencies should be avoided to prevent complexity and initialization issues.',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-illegal-cross-module-imports',
      comment: 'Only allowed communication between high-level modules through public APIs.',
      severity: 'warn',
      from: { path: '^src/services/(.+)/' },
      to: {
        path: '^src/services/(?!$1|core|intelligence)/',
        pathNot: '^src/services/(.+)/index\\.ts$'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho'
          }
        }
      }
    }
  }
};
