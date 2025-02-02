import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: {
    path: "openapi/build/openapi.yaml",
  },
  output: {
    path: "src/client",
  },
  plugins: [
    ...defaultPlugins,
    "@hey-api/client-fetch",
    // not worth it especially since it dosn't work on some endpoints yet
    //"@tanstack/solid-query",
    "zod",
  ],
});
