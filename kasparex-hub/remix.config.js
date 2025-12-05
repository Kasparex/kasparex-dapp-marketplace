/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  serverDependenciesToBundle: [
    "@base-org/account",
    /^@base-org\/.*/,
  ],
  browserNodeBuiltinsPolyfill: {
    modules: {
      buffer: true,
      events: true,
      stream: true,
      crypto: true,
      util: true,
    },
  },
};
