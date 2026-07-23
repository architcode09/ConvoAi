import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { store } from "./app/store";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in frontend/.env");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/auth">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </Provider>
  </StrictMode>,
);
