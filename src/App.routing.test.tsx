// @vitest-environment jsdom
//
// Router-migration guard (react-router-dom 6 -> 7).
//
// The v7 bump (PR: react-router-dom ^6.30.1 -> ^7.18.2) ships as a *lockfile +
// single dependency-version* change with zero source edits, because the app
// only uses react-router's declarative surface: <Routes>/<Route>, path params
// (`:slug`, `:token`, `:id`), <Navigate replace> redirects, the "*" catch-all,
// and the useNavigate / useLocation / useParams / <Link> hooks (see src/App.tsx).
//
// The existing component suites mount individual pages under a <MemoryRouter>,
// which proves the library resolves and <Link> renders — but nothing asserts
// that the *routing semantics* the app depends on still behave the same after a
// major-version bump. This file pins exactly those semantics against a route
// tree that mirrors the shapes used in App.tsx, so a future react-router change
// that alters param matching, redirect resolution, or catch-all fallthrough
// breaks CI instead of silently shipping a broken navigation.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  Link,
  MemoryRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

afterEach(() => cleanup());

// A slug-param page — mirrors App's `/insights/:slug`, `/cities/:slug`, etc.
function SlugPage() {
  const { slug } = useParams();
  return <div data-testid="slug-page">slug:{slug}</div>;
}

// A location probe so tests can read the resolved pathname after a redirect.
function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
}

// A route tree shaped like App.tsx's <Routes>: a static route, a slug-param
// route, a `<Navigate replace>` redirect (App uses this for /v3 -> / and
// /investor -> /investors), and the "*" catch-all NotFound.
function AppLikeRoutes() {
  return (
    <>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<div data-testid="home">home</div>} />
        <Route path="/insights/:slug" element={<SlugPage />} />
        <Route path="/investors" element={<div data-testid="investors">investors</div>} />
        {/* client redirect, exactly like App's /investor -> /investors */}
        <Route path="/investor" element={<Navigate to="/investors" replace />} />
        <Route path="*" element={<div data-testid="notfound">not-found</div>} />
      </Routes>
    </>
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppLikeRoutes />
    </MemoryRouter>,
  );
}

describe("react-router v7 declarative routing (migration guard)", () => {
  it("renders the static home route at '/'", () => {
    renderAt("/");
    expect(screen.getByTestId("home").textContent).toBe("home");
    expect(screen.getByTestId("pathname").textContent).toBe("/");
  });

  it("matches a :slug param route and exposes the param via useParams", () => {
    renderAt("/insights/phantom-jams");
    expect(screen.getByTestId("slug-page").textContent).toBe("slug:phantom-jams");
  });

  it("resolves a <Navigate replace> redirect to the target route", () => {
    renderAt("/investor");
    // The redirect renders the target element, not the redirect source...
    expect(screen.getByTestId("investors").textContent).toBe("investors");
    // ...and updates the resolved location to the target path.
    expect(screen.getByTestId("pathname").textContent).toBe("/investors");
    expect(screen.queryByTestId("notfound")).toBeNull();
  });

  it("falls through unknown paths to the '*' catch-all", () => {
    renderAt("/no-such-page");
    expect(screen.getByTestId("notfound").textContent).toBe("not-found");
    expect(screen.queryByTestId("home")).toBeNull();
  });

  it("navigates imperatively via useNavigate", () => {
    function NavButton() {
      const navigate = useNavigate();
      return (
        <button onClick={() => navigate("/insights/wave-onset")}>go</button>
      );
    }
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NavButton />} />
          <Route path="/insights/:slug" element={<SlugPage />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("go"));
    expect(screen.getByTestId("slug-page").textContent).toBe("slug:wave-onset");
  });

  it("renders a <Link> with the correct href", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Link to="/for-fleets">fleets</Link>
      </MemoryRouter>,
    );
    const link = screen.getByText("fleets") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/for-fleets");
  });
});
