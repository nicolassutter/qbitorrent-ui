import "dotenv/config";
import {
  createApp,
  createRouter,
  defineEventHandler,
  getRequestURL,
  proxyRequest,
} from "h3";

// Create an app instance
export const app = createApp();

// Create a new router and register it in app
const router = createRouter();
app.use(router);

router.use(
  "/api/**",
  defineEventHandler(async (event) => {
    const requestUrl = getRequestURL(event);
    const target = new URL(process.env.VITE_QBITORRENT_ORIGIN ?? "");
    target.pathname = requestUrl.pathname;
    const response = await proxyRequest(event, target.href);
    return response;
  }),
);
