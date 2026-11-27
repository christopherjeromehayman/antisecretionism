import base64
import json
import mimetypes
import shutil
from pathlib import Path
from xml.etree import ElementTree

origin = "https://antisecretionist.com"
definition_url = origin + "/what-is-anti-secretionism"
assets = {}
sitemap = ElementTree.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")


def add_asset(path, mime_type, data):
    assets[path] = [mime_type, base64.b64encode(data).decode()]


for file in sorted(Path("web").rglob("*")):
    if not file.is_file():
        continue
    path = "/" + file.relative_to("web").as_posix()
    mime_type = "text/javascript" if path.endswith(".js") else mimetypes.guess_type(path)[0]
    data = file.read_bytes()
    if file.suffix == ".html":
        route = "/" if path == "/index.html" else path[:-5]
        url = origin + route
        tags = f'<link rel="canonical" href="{url}">'
        if url == definition_url:
            term = {
                "@context": "https://schema.org",
                "@type": "DefinedTerm",
                "@id": url + "#term",
                "url": url,
                "name": "Anti-secretionism",
                "description": "Anti-secretionism is our community’s name for a way of eating that allows meat and plant foods and excludes dairy, honey, eggs and ingredients derived from animal secretions."
            }
            tags += '<script type="application/ld+json">' + json.dumps(term) + '</script>'
        data = data.decode().replace("</head>", tags + "</head>").encode()
        ElementTree.SubElement(ElementTree.SubElement(sitemap, "url"), "loc").text = url
        add_asset(path[:-5], mime_type, data)
    add_asset(path, mime_type or "application/octet-stream", data)

add_asset("/sitemap.xml", "application/xml", ElementTree.tostring(sitemap, encoding="utf-8", xml_declaration=True))
rules = "Allow: /\nDisallow: /api/\n"
robots = f"User-agent: OAI-SearchBot\nUser-agent: Claude-SearchBot\nUser-agent: Claude-User\n{rules}\nUser-agent: *\n{rules}\nSitemap: {origin}/sitemap.xml\n"
add_asset("/robots.txt", "text/plain", robots.encode())
out = Path("dist/server")
out.mkdir(exist_ok=True, parents=True)
(out / "index.js").write_text("const ASSETS=" + json.dumps(assets, separators=(",", ":")) + ";\n" + Path("worker/handler.js").read_text())
Path("dist/.openai").mkdir(exist_ok=True)
shutil.copy(".openai/hosting.json", "dist/.openai/hosting.json")
shutil.copytree("drizzle", "dist/drizzle", dirs_exist_ok=True)
