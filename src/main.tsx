import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./app.css";
import { router } from "./router";

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
