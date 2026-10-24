# -*- coding: utf-8 -*-
"""全市場月營收 -> CSV(code, ym, revenue 元)。在 Actions 上跑。

來源: 公開資訊觀測站月報彙總表 t21sc03(上市 sii / 上櫃 otc; _0 國內、_1 國外 KY), 單位千元。
(FinMind 全市場查詢要付費會員, 免費等級只能逐檔查。)
用法: python fetch_rev.py 2019 out.csv.gz              # 抓一整年(到 2026/09 為止)
      python fetch_rev.py 201901,202606 out.csv.gz     # 只補這幾個月
"""
import csv
import gzip
import re
import sys
import time

import requests

H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
HOSTS = ["https://mopsov.twse.com.tw", "https://mops.twse.com.tw"]
LAST = (2026, 9)
ROW = re.compile(r"<tr[^>]*>\s*<td[^>]*>\s*(\d{4})\s*</td>\s*<td[^>]*>[^<]*</td>\s*"
                 r"<td[^>]*>\s*([\d,\-]+)\s*</td>")


def page(path):
    for _ in range(3):
        for host in list(HOSTS):
            try:
                r = requests.get(host + path, headers=H, timeout=30)
            except Exception as e:
                print("ERR", host + path, e, flush=True)
                continue
            if r.status_code == 200 and len(r.content) > 3000:
                if HOSTS[0] != host:                 # 記住能用的主機
                    HOSTS.remove(host)
                    HOSTS.insert(0, host)
                return r.content.decode("big5", errors="ignore")
            if r.status_code == 404:
                return ""
        time.sleep(10)
    return None


def month(y, m):
    out, miss = [], []
    for mk in ("sii", "otc"):
        for kind in (0, 1):
            html = page(f"/nas/t21/{mk}/t21sc03_{y - 1911}_{m}_{kind}.html")
            if html is None:
                miss.append(f"{mk}_{kind}")
                continue
            for code, rev in ROW.findall(html):
                if rev.strip("-"):
                    out.append((code, f"{y:04d}{m:02d}", int(rev.replace(",", "")) * 1000))
            time.sleep(1.5)
    return out, miss


if __name__ == "__main__":
    arg, path = sys.argv[1], sys.argv[2]
    if "," in arg or len(arg) == 6:
        todo = [(int(x[:4]), int(x[4:])) for x in arg.split(",")]
    else:
        todo = [(int(arg), m) for m in range(1, 13) if (int(arg), m) <= LAST]
    with gzip.open(path, "wt", newline="", encoding="utf-8") as fp:
        w = csv.writer(fp)
        w.writerow(["code", "ym", "revenue"])
        for y, m in todo:
            rows, miss = month(y, m)
            w.writerows(rows)
            print(y, m, len(rows), "MISS" if miss else "", miss or "", flush=True)
