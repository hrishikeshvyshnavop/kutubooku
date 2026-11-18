const fs = require("fs");
const ts = require(require.resolve("typescript", { paths: [process.cwd()] }));
const KEEP = /eslint-(disable|enable)|@ts-(ignore|expect-error|nocheck)|^\/\/\/\s*<reference/;
let total = 0;
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, kind);
  const ranges = [];
  const seen = new Set();
  const add = (list) => (list || []).forEach((r) => {
    if (seen.has(r.pos)) return;
    seen.add(r.pos);
    if (KEEP.test(src.slice(r.pos, r.end))) return;
    ranges.push(r);
  });
  function visit(node) {
    if (ts.isJsxExpression(node) && !node.expression) {
      const text = src.slice(node.getStart(sf), node.end);
      if (KEEP.test(text)) { for (let p = node.getStart(sf); p < node.end; p++) seen.add(p); }
      else ranges.push({ pos: node.getStart(sf), end: node.end });
    }
    add(ts.getLeadingCommentRanges(src, node.getFullStart()));
    add(ts.getTrailingCommentRanges(src, node.end));
    ts.forEachChild(node, visit);
  }
  visit(sf);
  add(ts.getLeadingCommentRanges(src, sf.endOfFileToken.getFullStart()));
  const final = ranges.filter((r) => !ranges.some((o) => o !== r && o.pos <= r.pos && o.end >= r.end && (o.pos < r.pos || o.end > r.end))).sort((a, b) => b.pos - a.pos);
  if (!final.length) continue;
  let out = src;
  for (const r of final) out = out.slice(0, r.pos) + "\u0000" + out.slice(r.end);
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  const lines = out.split(/\r?\n/).flatMap((l) => {
    if (!l.includes("\u0000")) return [l];
    const t = l.replace(/\u0000/g, "").replace(/\s+$/, "");
    return t.trim() === "" ? [] : [t];
  });
  const text = lines.join(eol).replace(/(\r?\n){3,}/g, eol + eol).replace(/^\s*\r?\n/, "");
  fs.writeFileSync(file, text);
  total += final.length;
  console.log(file, final.length);
}
console.log("total removed", total);
