// Scoped to the migrated welcome configuration. Legacy consumers are still scanned
// for imports into it; unrelated legacy dependencies are not validated here.
module.exports = {
  forbidden: [
    { name: 'welcome-no-unresolved', severity: 'error',
      from: { path: '^handlers/welcome/' }, to: { couldNotResolve: true } },
    { name: 'welcome-no-cycles', severity: 'error',
      from: { path: '^handlers/welcome/' }, to: { circular: true } },
    { name: 'welcome-domain-dependencies', severity: 'error',
      from: { path: '^handlers/welcome/(?!index[.]js$|ui[.]js$)' },
      to: { pathNot: '^(handlers/welcome/|handlers/welcome-message[.]js$|node_modules/zod/)' } },
    { name: 'welcome-domain-no-presentation', severity: 'error',
      from: { path: '^handlers/welcome/(?!index[.]js$|ui[.]js$)' },
      to: { path: '^handlers/welcome/(index|ui)[.]js$' } },
    { name: 'welcome-ui-dependencies', severity: 'error',
      from: { path: '^handlers/welcome/ui[.]js$' },
      to: { pathNot: '^handlers/(welcome/contract[.]js|i18n/index[.]js)$' } },
    { name: 'welcome-public-entry-dependencies', severity: 'error',
      from: { path: '^handlers/welcome/index[.]js$' },
      to: { pathNot: '^handlers/welcome/(service|error|contract|ui)[.]js$' } },
    { name: 'welcome-private-entry', severity: 'error',
      from: { pathNot: '^(handlers/welcome/|handlers/welcome-configuration[.]js$)' },
      to: { path: '^handlers/welcome/', pathNot: '^handlers/welcome/index[.]js$' } },
    // Existing CAS repository owns validation/mapping; this is its only exception.
    { name: 'welcome-repository-contract-only', severity: 'error',
      from: { path: '^handlers/welcome-configuration[.]js$' },
      to: { path: '^handlers/welcome/', pathNot: '^handlers/welcome/(contract|error)[.]js$' } },
    { name: 'welcome-adapters-no-repositories', severity: 'error',
      from: { path: '^(dashboard/(configuration-routes|welcome-routes)[.]js|slashCommands/Welcome/(canal|mensaje)[.]js|handlers/welcome-access[.]js)$' },
      to: { path: '^handlers/(welcome-configuration|configuration-service|database)[.]js$' } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.welcome.json' },
  },
}
