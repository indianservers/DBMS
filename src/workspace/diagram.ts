export type DiagramColumn = {
  name: string;
  type: string;
  primary: boolean;
  foreign?: string;
};
export type DiagramPosition = { x: number; y: number };

const xml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });

export function buildDiagramSvg(
  tables: string[],
  columns: Record<string, DiagramColumn[]>,
  positions: Record<string, DiagramPosition>,
): string {
  const layout = Object.fromEntries(
    tables.map((name, index) => [
      name,
      positions[name] ?? {
        x: 32 + (index % 3) * 286,
        y: 30 + Math.floor(index / 3) * 292,
      },
    ]),
  ) as Record<string, DiagramPosition>;
  const minX = Math.min(0, ...tables.map((name) => layout[name].x - 24));
  const minY = Math.min(0, ...tables.map((name) => layout[name].y - 24));
  const maxX = Math.max(600, ...tables.map((name) => layout[name].x + 290));
  const maxY = Math.max(
    360,
    ...tables.map(
      (name) => layout[name].y + 62 + (columns[name]?.length ?? 0) * 23,
    ),
  );
  const links = tables.flatMap((name) =>
    (columns[name] ?? []).flatMap((column, index) => {
      if (!column.foreign) return [];
      const target = column.foreign.split(".")[0];
      if (!layout[target]) return [];
      const source = layout[name];
      const destination = layout[target];
      const x1 = source.x + 250;
      const y1 = source.y + 50 + index * 23;
      const x2 = destination.x;
      const y2 = destination.y + 36;
      return [
        `<path d="M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}" fill="none" stroke="#6585bd" stroke-width="2" marker-end="url(#arrow)"/>`,
      ];
    }),
  );
  const cards = tables.map((name) => {
    const { x, y } = layout[name];
    const fields = columns[name] ?? [];
    const height = 44 + fields.length * 23;
    return `<g transform="translate(${x} ${y})">
      <rect width="250" height="${height}" rx="9" fill="#ffffff" stroke="#90baf4"/>
      <path d="M9 0 H241 Q250 0 250 9 V38 H0 V9 Q0 0 9 0" fill="#e8f1ff"/>
      <text x="12" y="25" font-size="14" font-weight="700" fill="#24344e">${xml(name)}</text>
      ${fields
        .map(
          (field, index) =>
            `<text x="12" y="${57 + index * 23}" font-size="11" fill="#31425d">${field.primary ? "◆" : field.foreign ? "↗" : "·"} ${xml(field.name)}</text><text x="238" y="${57 + index * 23}" text-anchor="end" font-size="10" fill="#74849b">${xml(field.type)}</text>`,
        )
        .join("\n")}
    </g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX - minX}" height="${maxY - minY}" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="img" aria-label="Database schema diagram">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="#6585bd" stroke-width="1.5"/></marker></defs>
    <rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="#f9fcff"/>
    ${links.join("\n")}
    ${cards.join("\n")}
  </svg>`;
}
