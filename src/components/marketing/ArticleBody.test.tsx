// @vitest-environment jsdom
//
// Component tests for <ArticleBody>, the dependency-free Markdown renderer that
// turns an insight's `body` string into the rendered article DOM. This is the
// most logic-bearing piece of the /insights/:slug page: a hand-rolled
// line-based block parser (headings / blockquote / list / paragraph) plus an
// inline tokenizer (bold + links). Every insight on the site is rendered
// through it, so a parser regression (a dropped link, a collapsed list, an
// internal link that full-reloads instead of using the SPA router) would
// silently degrade every article and its internal-linking SEO. The parsing is
// pure but the output is JSX, so we mount it and assert against the real DOM.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ArticleBody from "./ArticleBody";

afterEach(() => cleanup());

function renderBody(body: string) {
  return render(
    <MemoryRouter>
      <ArticleBody body={body} />
    </MemoryRouter>
  );
}

describe("block parsing", () => {
  it("renders ## as an h2 and ### as an h3, stripping the marker", () => {
    const { container } = renderBody("## Big heading\n\n### Small heading");
    const h2 = container.querySelector("h2");
    const h3 = container.querySelector("h3");
    expect(h2?.textContent).toBe("Big heading");
    expect(h3?.textContent).toBe("Small heading");
  });

  it("does not treat #### (four hashes) as a heading — it falls through to a paragraph", () => {
    const { container } = renderBody("#### Not a supported heading");
    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelector("h3")).toBeNull();
    const p = container.querySelector("p");
    // `## ` only matches at index 0 with exactly the "## " prefix; "#### x"
    // starts with "## " is false (it's "###" then "# x"), so it's a paragraph.
    expect(p?.textContent).toBe("#### Not a supported heading");
  });

  it("renders a single paragraph from consecutive non-blank lines, joined by a space", () => {
    const { container } = renderBody("Line one\nline two\nline three");
    const ps = container.querySelectorAll("p");
    expect(ps.length).toBe(1);
    expect(ps[0].textContent).toBe("Line one line two line three");
  });

  it("splits paragraphs on a blank line", () => {
    const { container } = renderBody("First para.\n\nSecond para.");
    const ps = container.querySelectorAll("p");
    expect(ps.length).toBe(2);
    expect(ps[0].textContent).toBe("First para.");
    expect(ps[1].textContent).toBe("Second para.");
  });

  it("collapses one blockquote out of consecutive > lines, joined by a space", () => {
    const { container } = renderBody("> quote line one\n> quote line two");
    const quotes = container.querySelectorAll("blockquote");
    expect(quotes.length).toBe(1);
    expect(quotes[0].textContent).toBe("quote line one quote line two");
  });

  it("groups consecutive - lines into a single <ul> with one <li> per line", () => {
    const { container } = renderBody("- first\n- second\n- third");
    const uls = container.querySelectorAll("ul");
    expect(uls.length).toBe(1);
    const items = uls[0].querySelectorAll("li");
    expect(items.length).toBe(3);
    expect([...items].map((li) => li.textContent)).toEqual(["first", "second", "third"]);
  });

  it("starts a new list/paragraph when block type changes without a blank line", () => {
    const { container } = renderBody("A paragraph.\n- a bullet\n## A heading");
    expect(container.querySelector("p")?.textContent).toBe("A paragraph.");
    expect(container.querySelectorAll("ul li").length).toBe(1);
    expect(container.querySelector("h2")?.textContent).toBe("A heading");
  });

  it("renders nothing for an empty or whitespace-only body", () => {
    const { container } = renderBody("\n\n   \n");
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });
});

describe("inline tokenizing", () => {
  it("renders **bold** as a <strong> with the markers stripped", () => {
    const { container } = renderBody("plain **bolded** plain");
    const strong = container.querySelector("strong");
    expect(strong?.textContent).toBe("bolded");
    // Surrounding plain text is preserved on either side.
    expect(container.querySelector("p")?.textContent).toBe("plain bolded plain");
  });

  it("renders an internal /link as a router <a> (relative href, no new tab)", () => {
    const { container } = renderBody("see the [FAQ](/faq) page");
    const link = screen.getByText("FAQ").closest("a");
    expect(link).not.toBeNull();
    // react-router renders to an <a href> with the relative path; crucially it
    // is NOT target=_blank — internal links must stay in the SPA.
    expect(link?.getAttribute("href")).toBe("/faq");
    expect(link?.getAttribute("target")).toBeNull();
  });

  it("renders an external https link as a new-tab anchor with rel=noopener", () => {
    const { container } = renderBody("read [the study](https://example.com/paper)");
    const link = screen.getByText("the study").closest("a");
    expect(link?.getAttribute("href")).toBe("https://example.com/paper");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders multiple inline tokens in one line in order", () => {
    const { container } = renderBody("**bold** then [link](/x) then more");
    const p = container.querySelector("p");
    expect(p?.textContent).toBe("bold then link then more");
    expect(p?.querySelector("strong")?.textContent).toBe("bold");
    expect(p?.querySelector("a")?.getAttribute("href")).toBe("/x");
  });

  it("applies inline parsing inside headings, list items and blockquotes too", () => {
    const { container } = renderBody(
      "## A [linked](/h2) heading\n\n- a **bold** item\n\n> a [quoted](/q) line"
    );
    expect(container.querySelector("h2 a")?.getAttribute("href")).toBe("/h2");
    expect(container.querySelector("ul li strong")?.textContent).toBe("bold");
    expect(container.querySelector("blockquote a")?.getAttribute("href")).toBe("/q");
  });

  it("leaves text with no markup as a plain text node", () => {
    const { container } = renderBody("no markup here at all");
    const p = container.querySelector("p");
    expect(p?.textContent).toBe("no markup here at all");
    expect(p?.querySelector("strong")).toBeNull();
    expect(p?.querySelector("a")).toBeNull();
  });
});
