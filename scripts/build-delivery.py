#!/usr/bin/env python3
"""Render the editable closing report and assemble an allowlisted delivery ZIP.

Requires reportlab (the bundled Codex Python already provides it).
Run: python3 scripts/build-delivery.py
This command packages observed evidence; it never asserts completion or publishes.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone
from urllib.parse import quote, urljoin
from zipfile import ZipFile, ZIP_DEFLATED

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
REPOSITORY = "https://github.com/Sergionixx/MilenioExpress"
BRANCH = "dev-maxi"
WIDTH, HEIGHT = A4
MARGIN = 43
TEXT_WIDTH = WIDTH - MARGIN * 2 - 12
NAVY = colors.HexColor("#17314e")
TEAL = colors.HexColor("#106c60")
INK = colors.HexColor("#233347")
MUTED = colors.HexColor("#56687b")
RULE = colors.HexColor("#dbe4ec")
SHA = lambda data: hashlib.sha256(data).hexdigest()


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def register_fonts() -> tuple[str, str, str]:
    candidates = [
        (Path("/System/Library/Fonts/Supplemental"), "Arial.ttf", "Arial Bold.ttf", "Arial Italic.ttf"),
        (Path("/usr/share/fonts/truetype/dejavu"), "DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSans-Oblique.ttf"),
        (Path("/usr/share/fonts/truetype/liberation2"), "LiberationSans-Regular.ttf", "LiberationSans-Bold.ttf", "LiberationSans-Italic.ttf"),
    ]
    if os.environ.get("DELIVERY_FONT_DIR"):
        candidates.insert(0, (Path(os.environ["DELIVERY_FONT_DIR"]), "LiberationSans-Regular.ttf", "LiberationSans-Bold.ttf", "LiberationSans-Italic.ttf"))
    for directory, regular, bold, italic in candidates:
        paths = [directory / filename for filename in (regular, bold, italic)]
        if all(path.is_file() for path in paths):
            for name, path in zip(("ME", "ME-Bold", "ME-Italic"), paths):
                pdfmetrics.registerFont(TTFont(name, str(path)))
            pdfmetrics.registerFontFamily("ME", normal="ME", bold="ME-Bold", italic="ME-Italic", boldItalic="ME-Bold")
            return "ME", "ME-Bold", "ME-Italic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


FONT, BOLD, ITALIC = register_fonts()
MONO = "Courier"
for mono_path in (
    Path("/System/Library/Fonts/Supplemental/Courier New.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
    Path("/usr/share/fonts/truetype/liberation2/LiberationMono-Regular.ttf"),
):
    if mono_path.is_file():
        pdfmetrics.registerFont(TTFont("ME-Mono", str(mono_path)))
        MONO = "ME-Mono"
        break
STYLES = {
    "title": ParagraphStyle("title", fontName=BOLD, fontSize=27, leading=31, textColor=NAVY, spaceAfter=16, keepWithNext=True),
    "eyebrow": ParagraphStyle("eyebrow", fontName=BOLD, fontSize=8.5, leading=12, textColor=TEAL, spaceAfter=8, keepWithNext=True),
    "h2": ParagraphStyle("h2", fontName=BOLD, fontSize=15, leading=19, textColor=NAVY, spaceBefore=19, spaceAfter=8, keepWithNext=True),
    "h3": ParagraphStyle("h3", fontName=BOLD, fontSize=11.7, leading=16, textColor=TEAL, spaceBefore=14, spaceAfter=7, keepWithNext=True),
    "body": ParagraphStyle("body", fontName=FONT, fontSize=9.5, leading=14, textColor=INK, spaceAfter=8, splitLongWords=True, allowWidows=0, allowOrphans=0),
    "list": ParagraphStyle("list", fontName=FONT, fontSize=9.5, leading=14, textColor=INK, spaceAfter=7, leftIndent=15, firstLineIndent=0, bulletIndent=0, bulletFontName=BOLD, bulletFontSize=9),
    "cell": ParagraphStyle("cell", fontName=FONT, fontSize=8.2, leading=11.1, textColor=INK, splitLongWords=True),
    "cellhead": ParagraphStyle("cellhead", fontName=BOLD, fontSize=8.2, leading=11.1, textColor=colors.white, splitLongWords=True),
    "code": ParagraphStyle("code", fontName=MONO, fontSize=7.8, leading=11.5, textColor=INK, backColor=colors.HexColor("#f2f5f8"), borderPadding=8, spaceAfter=10, splitLongWords=True),
}


def normalize(text: str) -> str:
    for old, new in {"—": "-", "–": "-", "‑": "-", "→": " -> ", "≥": ">=", "…": "...", "\u00a0": " "}.items():
        text = text.replace(old, new)
    return text


def inline(text: str) -> str:
    text = html.escape(normalize(text), quote=False)
    saved: list[str] = []

    def stash(value: str) -> str:
        saved.append(value)
        return f"MEINLINEPLACEHOLDER{len(saved) - 1}END"

    def code(match: re.Match) -> str:
        return stash(f'<font name="{MONO}" size="8.1" color="#17314e">{match.group(1)}</font>')

    text = re.sub(r"`([^`]+)`", code, text)

    def link(match: re.Match) -> str:
        label, destination = match.group(1), html.unescape(match.group(2))
        if not re.match(r"^https?://", destination):
            destination = urljoin(f"{REPOSITORY}/blob/{BRANCH}/docs/", destination)
        if not destination.startswith(("https://", "http://")):
            return label
        return stash(f'<a href="{html.escape(destination, quote=True)}" color="#106c60">{label}</a>')

    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    for index, value in enumerate(saved):
        text = text.replace(f"MEINLINEPLACEHOLDER{index}END", value)
    return text


def table_cells(line: str) -> list[str]:
    return [cell.strip().replace(r"\|", "|") for cell in re.split(r"(?<!\\)\|", line.strip().strip("|"))]


def make_table(rows: list[list[str]]) -> Table:
    columns = len(rows[0])
    widths = {
        2: [0.28, 0.72],
        3: [0.19, 0.48, 0.33],
        4: [0.14, 0.23, 0.36, 0.27],
        5: [0.15, 0.26, 0.27, 0.17, 0.15],
    }.get(columns, [1 / columns] * columns)
    content = []
    for index, row in enumerate(rows):
        row = (row + [""] * columns)[:columns]
        content.append([Paragraph(inline(cell), STYLES["cellhead" if index == 0 else "cell"]) for cell in row])
    table = Table(content, colWidths=[TEXT_WIDTH * fraction for fraction in widths], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f6f9")]),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, NAVY),
        ("LINEBELOW", (0, 1), (-1, -1), 0.35, RULE),
    ]))
    return table


def markdown_story(markdown: str) -> list:
    lines = markdown.splitlines()
    story = [Paragraph("MILENIO EXPRESS / ENTREGA DEL PROYECTO", STYLES["eyebrow"])]
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith("```"):
            block = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block.append(html.escape(normalize(lines[i])))
                i += 1
            story.append(Paragraph("<br/>".join(block), STYLES["code"]))
            i += 1
            continue
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|?[ :|-]+\|\s*$", lines[i + 1]):
            rows = [table_cells(line)]
            i += 2
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                rows.append(table_cells(lines[i]))
                i += 1
            story.extend([make_table(rows), Spacer(1, 9)])
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            level = len(heading.group(1))
            style = "title" if level == 1 else f"h{level}"
            story.append(Paragraph(inline(heading.group(2)), STYLES[style]))
            if level == 1:
                story.extend([HRFlowable(width="100%", thickness=2.5, color=TEAL, spaceAfter=14)])
            i += 1
            continue
        bullet = re.match(r"^(?:(\d+)\.\s+|[-*]\s+)(.+)$", line)
        if bullet:
            label = f"{bullet.group(1)}." if bullet.group(1) else "-"
            story.append(Paragraph(inline(bullet.group(2)), STYLES["list"], bulletText=label))
            i += 1
            continue
        paragraph = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(?:#{1,3}\s|\||```|\d+\.\s|[-*]\s)", lines[i].strip()):
            paragraph.append(lines[i].strip())
            i += 1
        story.append(Paragraph(inline(" ".join(paragraph)), STYLES["body"]))
    return story


def render_pdf(markdown: str, destination: Path, reference: str, generated: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)

    def page(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, 38, WIDTH - MARGIN, 38)
        canvas.setFont(FONT, 7.3)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN, 26, f"Milenio Express | dev-maxi | Ref. {reference[:10]}")
        canvas.drawRightString(WIDTH - MARGIN, 26, f"{document.page}")
        if document.page > 1:
            canvas.setFont(BOLD, 7.3)
            canvas.setFillColor(TEAL)
            canvas.drawString(MARGIN, HEIGHT - 29, "INFORME DE CIERRE / MILENIO EXPRESS")
        canvas.restoreState()

    document = SimpleDocTemplate(str(destination), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                                 topMargin=45, bottomMargin=53, title="Informe de cierre - Milenio Express",
                                 author="Equipo Milenio Express", subject="Cierre, calidad, seguridad y mejora continua",
                                 pageCompression=1)
    document.build(markdown_story(markdown), onFirstPage=page, onLaterPages=page)


ALLOWED_EXTENSIONS = {".md", ".json", ".html", ".xml", ".tap", ".info", ".txt", ".csv", ".yaml", ".yml", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf", ".log"}
BLOCKED_PARTS = {"node_modules", ".git", ".env", ".work", ".cache", ".temp", "__pycache__"}
BINARY_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}


def assert_safe_file(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    return not path.is_symlink() and path.resolve().is_relative_to(ROOT) and path.suffix.lower() in ALLOWED_EXTENSIONS and not any(
        part in BLOCKED_PARTS or part.startswith(".env") or part.startswith(".") for part in relative.parts
    )


def package_delivery(pdf: Path, zip_path: Path, reference: str, generated: str, source_hash: str) -> dict:
    payload: dict[str, bytes] = {}
    skipped_lfs = []
    for directory in ("docs", "reportes", "evidencias"):
        base = ROOT / directory
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file() or not assert_safe_file(path):
                continue
            if path == pdf:
                continue
            data = path.read_bytes()
            relative = path.relative_to(ROOT).as_posix()
            if data.startswith(b"version https://git-lfs.github.com/spec/v1"):
                skipped_lfs.append({"file": relative, "pointer": data.decode().strip(), "url": f"{REPOSITORY}/blob/{BRANCH}/{quote(relative)}"})
                continue
            payload[relative] = data
    for path in sorted((ROOT / ".github/workflows").glob("*.y*ml")):
        if path.is_file() and not path.is_symlink():
            payload[f"pipeline/{path.name}"] = path.read_bytes()
            payload[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    for name in ("README.md", "MILENIO_EXPRESS.md", ".env.example"):
        path = ROOT / name
        if not path.is_file() or path.is_symlink():
            raise FileNotFoundError(f"Missing required delivery document: {name}")
        payload[name] = path.read_bytes()
    for name in ("Dockerfile", "supabase/config.toml"):
        path = ROOT / name
        if path.is_file() and not path.is_symlink():
            payload[f"codigo-fuente/{name}"] = path.read_bytes()
    payload["informe-cierre.pdf"] = pdf.read_bytes()
    payload[pdf.relative_to(ROOT).as_posix()] = pdf.read_bytes()
    payload["evidencias/capturas-historicas-lfs.json"] = (json.dumps({
        "note": ("Algunas capturas históricas siguen como punteros LFS. No se presentan como imágenes descargadas ni evidencia nueva. Los enlaces y objetos originales quedan identificados."
                 if skipped_lfs else "No se detectaron punteros LFS pendientes. Las imágenes históricas disponibles se incluyen con sus bytes originales; no constituyen evidencia nueva."),
        "unavailable_images": skipped_lfs,
    }, ensure_ascii=False, indent=2) + "\n").encode()
    dirty = bool(git("status", "--porcelain", "--untracked-files=all"))
    payload["codigo-fuente/REPOSITORIO.md"] = f"""# Código fuente

- Repositorio: {REPOSITORY}
- Rama autorizada de entrega: [{BRANCH}]({REPOSITORY}/tree/{BRANCH}).
- Referencia Git observada al empaquetar: `{reference}`.
- Consulta del commit: {REPOSITORY}/tree/{reference}
- Árbol con cambios pendientes al generar: {'sí' if dirty else 'no'}.
- Generación UTC: {generated}.

El PDF permite incluir un enlace al repositorio en lugar de copiar todo el código al ZIP. Las instrucciones de instalación, variables, ejecución, pruebas y análisis están en `README.md`. La guía funcional y de negocio está en `MILENIO_EXPRESS.md`.

Si el árbol tenía cambios pendientes, la referencia anterior identifica el HEAD observado y **no acredita que todos los documentos o cambios locales ya estén publicados en ese commit**. El estado definitivo de GitHub y la ejecución de CI deben contrastarse con las evidencias del informe. Este empaquetador no hace commits, push, deploy ni transiciones en Jira.
""".encode()
    payload["LEEME_ENTREGA.md"] = f"""# Paquete de entrega de Milenio Express

Generado el {generated}. Este paquete conserva el estado documentado; no convierte actividades pendientes en terminadas.

1. Abrir `informe-cierre.pdf` para cierre, desviaciones, lecciones y mejora continua.
2. Consultar `MILENIO_EXPRESS.md` para funcionamiento, idea de negocio y tecnicismos.
3. Seguir `README.md` y `codigo-fuente/REPOSITORIO.md` para recuperar y ejecutar el código.
4. Revisar `pipeline/`, `reportes/` y `evidencias/` para configuración, métricas y resultados originales.
5. Abrir `reportes/sonar/final.html` y los HTML de `reportes/seguridad-zap` en un navegador.

El manifiesto `MANIFIESTO.json` permite comprobar integridad por SHA-256. Se incluye únicamente `.env.example` con valores de ejemplo. No se incluyen archivos `.env` reales, credenciales privadas, `node_modules`, la carpeta `.git` ni punteros LFS disfrazados de imágenes. Los punteros históricos que no se descargaron quedan listados en `evidencias/capturas-historicas-lfs.json`.

Las dependencias humanas, los accesos remotos y las propuestas futuras conservan el estado expresado en el informe. La generación del ZIP no equivale a aceptación del equipo ni a publicación del backend remoto.
""".encode()
    manifest = {
        "generatedAt": generated, "repository": REPOSITORY, "branch": BRANCH, "observedHead": reference,
        "workingTreeHadChanges": dirty, "markdownSourceSha256": source_hash,
        "files": [{"path": name, "bytes": len(data), "sha256": SHA(data)} for name, data in sorted(payload.items())],
        "excludedLfsPointers": [item["file"] for item in skipped_lfs],
    }
    payload["MANIFIESTO.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(zip_path, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(payload.items()):
            archive.writestr(f"entrega-final-milenio-express/{name}", data)
    with ZipFile(zip_path) as archive:
        error = archive.testzip()
        if error:
            raise RuntimeError(f"ZIP checksum failed: {error}")
        for name in archive.namelist():
            if any((part.startswith(".env") and part != ".env.example") or part in BLOCKED_PARTS for part in Path(name).parts):
                raise RuntimeError(f"Forbidden file in ZIP: {name}")
    return {"files": len(payload), "bytes": zip_path.stat().st_size, "skippedLfsPointers": len(skipped_lfs)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default="docs/INFORME_CIERRE.md")
    parser.add_argument("--pdf", default="docs/INFORME_CIERRE.pdf")
    parser.add_argument("--zip", default="entrega/entrega-final-milenio-express.zip")
    args = parser.parse_args()
    source, pdf, archive = (ROOT / value for value in (args.source, args.pdf, args.zip))
    for path in (source, pdf, archive):
        if not path.resolve().is_relative_to(ROOT):
            raise ValueError("Delivery paths must remain inside this repository.")
    markdown = source.read_text(encoding="utf8")
    reference = git("rev-parse", "HEAD")
    generated = datetime.now(timezone.utc).isoformat(timespec="seconds")
    render_pdf(markdown, pdf, reference, generated)
    result = package_delivery(pdf, archive, reference, generated, SHA(markdown.encode()))
    print(json.dumps({"pdf": str(pdf), "pdfBytes": pdf.stat().st_size, "zip": str(archive), **result}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
