import { routeTree } from "./routeTree.gen";

import { createRouter } from "@tanstack/react-router";

// Set up a Router instance
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});
