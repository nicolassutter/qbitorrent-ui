import {
  Outlet,
  createRootRoute,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { client } from "@/client/client.gen";
import { checkAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/sidebar";
import { queryClient } from "@/lib/queryClient";
import { LucideLoaderCircle } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";

const AppLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <LucideLoaderCircle className="w-8 h-8 animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
  pendingComponent: AppLoader,
  wrapInSuspense: true,
  async beforeLoad({ location }) {
    const isAuth = await checkAuth();

    const isPublicRoute = () => location.pathname === "/login";
    const canAccess = () => isAuth || isPublicRoute();

    if (isAuth && location.pathname === "/login") {
      throw redirect({ to: "/" });
    }

    if (!canAccess()) {
      throw redirect({ to: "/login" });
    }
  },
});

// makes sure the client is configured before any requests are made
client.setConfig({
  baseUrl: import.meta.env.DEV ? "http://localhost:3001/api/v2" : "/api/v2",
  headers: {
    Referer: import.meta.env.VITE_QBITORRENT_ORIGIN ?? "",
  },
  throwOnError: true,
  credentials: "include",
});

function App({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex">
      {location.pathname !== "/login" && <Sidebar />}
      <div className="w-full p-2">{children}</div>
    </div>
  );
}

function RootComponent() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <App>
          <Outlet />
        </App>
      </QueryClientProvider>

      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
