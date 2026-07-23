import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // A 404 navigation is not an application error. Logging it via
    // console.error trips Lighthouse's errors-in-console audit; console.warn
    // keeps the diagnostic without flagging the page as broken.
    console.warn("404: route not found:", location.pathname);
  }, [location.pathname]);

  // <main> provides the single required landmark (landmark-one-main).
  // Text colors use the near-white --foreground token on the dark bg-muted so
  // they clear WCAG AA contrast (the previous muted-foreground / primary on
  // bg-muted failed color-contrast).
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-foreground/90">Oops! Page not found</p>
        <a
          href="/"
          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          Return to Home
        </a>
      </div>
    </main>
  );
};

export default NotFound;
