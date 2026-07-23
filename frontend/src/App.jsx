import { WallpaperProvider } from "./context/WallpaperContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "@clerk/react";
import PageLoader from "./components/PageLoader";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { checkAuth, clearAuth } from "./store/authSlice";
import { resetChatForSignOut } from "./store/chatSlice";
import { clearClerkTokenGetter, setClerkTokenGetter } from "./lib/clerkAuth";

function App() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const dispatch = useAppDispatch();
  const isCheckingAuth = useAppSelector((state) => state.auth.isCheckingAuth);

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
    return () => clearClerkTokenGetter();
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      dispatch(checkAuth());
      return;
    }

    dispatch(clearAuth());
    dispatch(resetChatForSignOut());
  }, [dispatch, isLoaded, isSignedIn]);

  if (!isLoaded || (isSignedIn && isCheckingAuth)) return <PageLoader />;

  return (
    <ThemeProvider>
      <WallpaperProvider>
        <Routes>
          <Route path="/" element={isSignedIn ? <ChatPage /> : <Navigate to={"/auth"} replace />} />
          <Route
            path="/auth"
            element={!isSignedIn ? <AuthPage /> : <Navigate to={"/"} replace />}
          />
          <Route path="*" element={<Navigate to={isSignedIn ? "/" : "/auth"} replace />} />
        </Routes>
        <Toaster />
      </WallpaperProvider>
    </ThemeProvider>
  );
}

export default App;
