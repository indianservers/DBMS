import { describe, expect, it } from "vitest";
import { buildDiagramSvg } from "./diagram";

describe("schema diagram export", () => {
  it("includes live fields and a foreign-key link", () => {
    const svg = buildDiagramSvg(
      ["orders", "customers"],
      {
        orders: [
          { name: "id", type: "INT", primary: true },
          {
            name: "customer_id",
            type: "INT",
            primary: false,
            foreign: "customers.id",
          },
        ],
        customers: [{ name: "id", type: "INT", primary: true }],
      },
      { orders: { x: 20, y: 30 }, customers: { x: 400, y: 30 } },
    );
    expect(svg).toContain("customer_id");
    expect(svg).toContain('marker-end="url(#arrow)"');
    expect(svg).toContain("translate(400 30)");
  });

  it("escapes names and types before writing SVG markup", () => {
    const svg = buildDiagramSvg(
      ["a<&"],
      { "a<&": [{ name: 'x"', type: "TEXT<5>", primary: false }] },
      {},
    );
    expect(svg).toContain("a&lt;&amp;");
    expect(svg).toContain("x&quot;");
    expect(svg).toContain("TEXT&lt;5&gt;");
  });
});
