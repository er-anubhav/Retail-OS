#!/usr/bin/env python3
"""Build the RetailEdge AI System Design Plan PDF.

Pipeline: markdown -> pre-processing (print-safe chars, markdown="1" divs)
-> python-markdown -> TOC anchor rewrite -> WeasyPrint PDF.

Formulas are hand-authored HTML in the source (div.formula) so no LaTeX
conversion is needed here.
"""
import re
from pathlib import Path

import markdown
from weasyprint import HTML

SRC = Path("system-design-plan.md")
OUT = Path("RetailEdge-AI-System-Design-Plan.pdf")

CSS = """
@page {
    size: A4;
    margin: 22mm 18mm 20mm 18mm;
    @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'DejaVu Sans', sans-serif;
        font-size: 8pt;
        color: #8a8f98;
    }
    @bottom-left {
        content: "RetailEdge AI — System Design Plan v1.0 · SIH 26179";
        font-family: 'DejaVu Sans', sans-serif;
        font-size: 8pt;
        color: #8a8f98;
    }
}
@page :first {
    @bottom-left { content: none; }
    @bottom-right { content: none; }
}

html { font-size: 9.8pt; }

body {
    font-family: 'DejaVu Sans', 'Noto Sans', sans-serif;
    line-height: 1.5;
    color: #1c2733;
    hyphens: none;
}

h1 {
    font-size: 21pt;
    line-height: 1.25;
    color: #0b2545;
    border-bottom: 3px solid #d64550;
    padding-bottom: 8px;
    margin: 0 0 14px 0;
    page-break-after: avoid;
}
h2 {
    font-size: 15pt;
    color: #0b2545;
    border-bottom: 1.5px solid #d8dee6;
    padding-bottom: 5px;
    margin: 26px 0 10px 0;
    page-break-after: avoid;
}
h3 {
    font-size: 11.8pt;
    color: #d64550;
    margin: 18px 0 6px 0;
    page-break-after: avoid;
}
h4 {
    font-size: 10.3pt;
    color: #34495e;
    margin: 12px 0 4px 0;
    page-break-after: avoid;
}

p { margin: 6px 0; orphans: 2; widows: 2; }

strong { color: #0b2545; }

/* ---------- tables ---------- */
table {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0 14px 0;
    font-size: 8.4pt;
    page-break-inside: avoid;
}
th {
    background: #0b2545;
    color: #ffffff;
    text-align: left;
    padding: 5px 7px;
    font-size: 8.2pt;
}
td {
    border-bottom: 1px solid #e2e7ee;
    padding: 5px 7px;
    vertical-align: top;
}
tbody tr:nth-child(even) { background: #f4f6f9; }

/* ---------- code & diagrams ---------- */
pre {
    background: #0e1726;
    color: #d9e2ec;
    padding: 12px 14px;
    border-radius: 6px;
    font-family: 'DejaVu Sans Mono', monospace;
    font-size: 6.5pt;
    line-height: 1.3;
    page-break-inside: avoid;
    overflow: hidden;
}
code {
    font-family: 'DejaVu Sans Mono', monospace;
    font-size: 8.3pt;
    background: #eef1f5;
    padding: 1px 4px;
    border-radius: 3px;
    color: #0b2545;
}
pre code { background: none; padding: 0; color: inherit; font-size: inherit; }

.diagram pre {
    background: #f7f9fc;
    color: #10243e;
    border: 1px solid #d8dee6;
    border-left: 4px solid #d64550;
    font-size: 5.9pt;
    line-height: 1.22;
}

/* ---------- math blocks (hand-authored HTML in source) ---------- */
.formula {
    background: #f7f9fc;
    border-left: 4px solid #0b2545;
    padding: 8px 14px;
    margin: 8px 0 12px 0;
    font-family: 'DejaVu Serif', serif;
    font-size: 9.5pt;
    page-break-inside: avoid;
}

/* ---------- callouts ---------- */
blockquote {
    margin: 10px 0;
    padding: 9px 14px;
    background: #fdf3f3;
    border-left: 4px solid #d64550;
    color: #3a2020;
    font-size: 9.2pt;
    page-break-inside: avoid;
}

/* ---------- doc meta block ---------- */
.doc-meta {
    background: #f4f6f9;
    border: 1px solid #d8dee6;
    border-radius: 6px;
    padding: 4px 14px;
    margin: 12px 0;
    page-break-inside: avoid;
}
.doc-meta table { margin: 0; }
.doc-meta th { background: none; color: #0b2545; width: 30%; padding: 4px 8px 4px 0; }
.doc-meta td { border-bottom: none; background: none !important; }

/* ---------- lists ---------- */
ul, ol { margin: 6px 0 10px 0; padding-left: 20px; }
li { margin: 3px 0; }

/* ---------- misc ---------- */
hr {
    border: none;
    border-top: 1px solid #d8dee6;
    margin: 18px 0;
}
a { color: #0b2545; text-decoration: none; }

.avoid-break { page-break-inside: avoid; }
"""


def preprocess(md_text: str) -> str:
    """Pre-processing passes before markdown conversion."""

    # 1. Diagram fences sit flush against their wrapping div
    md_text = re.sub(r'<div class="diagram">\s*```', '<div class="diagram">\n```', md_text)

    # 2. print-safe character substitutions
    md_text = (md_text
               .replace("\u00A0", " ")
               .replace("₹", "&#8377;")
               .replace("≤", "&#8804;")
               .replace("≥", "&#8805;")
               .replace("→", "&#8594;")
               .replace("×", "&#215;"))

    # 3. make the two named divs render their markdown content
    #    (.formula divs contain raw HTML only and pass through untouched)
    md_text = md_text.replace('<div class="doc-meta">', '<div class="doc-meta" markdown="1">')
    md_text = md_text.replace('<div class="diagram">', '<div class="diagram" markdown="1">')

    return md_text


def fix_anchors(html: str) -> str:
    """Make in-document TOC links match python-markdown's generated heading ids."""
    heading_ids = set(re.findall(r'<h[1-3][^>]*id="([^"]+)"', html))

    def href_repl(m):
        target = m.group(1)
        if target in heading_ids:
            return m.group(0)
        slug = re.sub(r"[^\w\s-]", "", target.lower())
        slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
        if slug in heading_ids:
            return f'href="#{slug}"'
        # drop dead in-page links, keep plain text
        return m.group(0).replace(f'href="#{target}"', "")

    return re.sub(r'href="#([^"]+)"', href_repl, html)


def main() -> None:
    md_text = SRC.read_text(encoding="utf-8")
    md_text = preprocess(md_text)

    body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "attr_list", "md_in_html", "sane_lists", "toc"],
        extension_configs={"md_in_html": {}, "toc": {"anchorlink": False}},
    )
    body = fix_anchors(body)

    html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>RetailEdge AI — System Design Plan</title>
<style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""

    HTML(string=html_doc, base_url=".").write_pdf(OUT)
    print(f"Wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
