# -*- coding: utf-8 -*-
"""全市場月營收 2019/01 起 -> CSV(code, ym, revenue)。在 Actions 上跑。

先試 FinMind 全市場(不帶 data_id、不帶 token, 依公布月份查); 一個月拿不到上千筆就改抓
公開資訊觀測站月報彙總表(t21sc03, 上市 sii / 上櫃 otc)。
用法: python fetch_rev.py 201901 202609 out.csv.gz
"""
import csv
import gzip
import io
import re
import sys
import time

import requests

H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


def months(a, b):
    y, m = int(a[:4]), int(a[4:])
    while (y, m) <= (int(b[:4]), int(b[4:])):
        yield y, m
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)


def finmind(y, m):
    """公布月份 = 營收月份的次月 -> 查次月 1 日~月底。"""
    py, pm = (y + 1, 1) if m == 12 else (y, m + 1)
    for i in range(4):
        try:
            j = requests.get("https://api.finmindtrade.com/api/v4/data", headers=H, timeout=90, params={
                "dataset": "TaiwanStockMonthRevenue", "start_date": f"{py}-{pm:02d}-01",
                "end_date": f"{py}-{pm:02d}-28"}).json()
            if j.get("status") == 200:
                return [(str(x["stock_id"]), f"{int(x['revenue_year']):04d}{int(x['revenue_month']):02d}",
                         int(x["revenue"])) for x in j.get("data", [])
                        if int(x["revenue_year"]) == y and int(x["revenue_month"]) == m]
            print("finmind", y, m, j.get("msg"), flush=True)
        except Exception as e:
            print("finmind", y, m, e, flush=True)
        time.sleep(15 * (i + 1))
    return []


def mops(y, m):
    out = []
    for mk in ("sii", "otc"):
        for host in ("https://mopsov.twse.com.tw", "https://mops.twse.com.tw"):
            url = f"{host}/nas/t21/{mk}/t21sc03_{y - 1911}_{m}_0.html"
            try:
                r = requests.get(url, headers=H, timeout=60)
                if r.status_code != 200 or len(r.content) < 5000:
                    continue
                html = r.content.decode("big5", errors="ignore")
                # 每列: <td>代號</td><td>名稱</td><td>當月營收</td>...(單位: 千元)
                for code, rev in re.findall(
                        r"<tr[^>]*>\s*<td[^>]*>\s*(\d{4})\s*</td>\s*<td[^>]*>[^<]*</td>\s*<td[^>]*>\s*([\d,\-]+)\s*</td>",
                        html):
                    if rev.strip("-"):
                        out.append((code, f"{y:04d}{m:02d}", int(rev.replace(",", "")) * 1000))
                break
            except Exception as e:
                print("mops", url, e, flush=True)
        time.sleep(3)
    return out


if __name__ == "__main__":
    a, b, path = sys.argv[1:4]
    with gzip.open(path, "wt", newline="", encoding="utf-8") as fp:
        w = csv.writer(fp)
        w.writerow(["code", "ym", "revenue"])
        for y, m in months(a, b):
            rows = finmind(y, m)
            src = "finmind"
            if len(rows) < 1000:
                rows, src = mops(y, m), "mops"
            w.writerows(rows)
            print(y, m, src, len(rows), flush=True)
            time.sleep(2)
