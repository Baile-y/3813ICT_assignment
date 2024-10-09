exports.config = {
    framework: 'mocha',
    directConnect: true,
    specs: ['e2e/**/*.e2e-spec.ts'],
    capabilities: {
      browserName: 'chrome',
    },
    mochaOpts: {
      timeout: 30000,
    }
  };
  