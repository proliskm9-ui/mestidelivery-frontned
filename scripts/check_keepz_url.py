# -*- coding: utf-8 -*-
import re
import urllib.request

html = urllib.request.urlopen("https://mestidelivery.com/", timeout=25).read().decode("utf-8", "replace")
js_files = re.findall(r"/static/(?:Payment|PaymentPage|index)-[^\"']+\.js", html)
print("candidates", js_files)
# also fetch all script tags
all_js = re.findall(r'src="(/static/[^"]+\.js)"', html)
found = set()
for path in all_js:
    url = "https://mestidelivery.com" + path
    try:
        body = urllib.request.urlopen(url, timeout=30).read().decode("utf-8", "replace")
    except Exception as e:
        print("fail", path, e)
        continue
    urls = re.findall(r"https://tiny\.keepz\.me/[A-Za-z0-9]+", body)
    if urls or "keepz" in body.lower():
        found.update(urls)
        print(path, "->", sorted(set(urls)) or "keepz mentioned, no tiny url")
print("ALL", sorted(found) or "none")
