# -*- coding: utf-8 -*-
"""映興型回測: 抓上市櫃全市場日行情 + 融資餘額(含限額)。

在 GitHub Actions 上跑(本機雲端環境擋了證交所/櫃買)。
  python fetch.py probe 20261001          印出各端點欄位與映興那一列
  python fetch.py fetch 20210101 20210630 out.csv.gz
端點與欄位定位照 alpha-vibe-trader/avt/fetch/{twse,tpex}.py。
"""
import csv
import datetime as dt
import gzip
import json
import re
import sys
import time

import requests

H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
TWSE_GAP = 3.2      # 證交所: 每 5 秒 3 次以上會被鎖 IP
TPEX_GAP = 1.5


def num(s):
    if s is None:
        return None
    s = re.sub(r"<[^>]+>", "", str(s)).replace(",", "").strip()
    if s in ("", "--", "---", "N/A", "除權息", "除息", "除權"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def get(url, params, gap):
    last = None
    for i in range(5):
        try:
            r = requests.get(url, params=params, headers=H, timeout=40)
            r.raise_for_status()
            j = r.json()
            time.sleep(gap)
            return j
        except Exception as e:  # 限流時常回 HTML, json() 會炸
            last = e
            time.sleep(10 * (i + 1))
    raise RuntimeError(f"{url} {params}: {last}")


def fidx(f, *kws, exact=None, nth=0):
    hits = [x for x, k in enumerate(f) if (k == exact if exact else all(w in k for w in kws))]
    return hits[nth] if len(hits) > nth else None


def slash(d):
    return f"{d[:4]}/{d[4:6]}/{d[6:]}"


def twse_quotes(d):
    j = get("https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX",
            {"response": "json", "date": d, "type": "ALLBUT0999"}, TWSE_GAP)
    if j.get("stat") != "OK":
        return None
    for t in j.get("tables", []):
        f = t.get("fields") or []
        if "證券代號" not in f or "收盤價" not in f:
            continue
        ic, inm = f.index("證券代號"), f.index("證券名稱")
        iv, io, ih, il, icl, idf = (f.index(k) for k in
                                    ["成交股數", "開盤價", "最高價", "最低價", "收盤價", "漲跌價差"])
        isg = next((x for x, k in enumerate(f) if "漲跌(" in k), None)
        out = {}
        for r in t["data"]:
            code = str(r[ic]).strip()
            if not re.fullmatch(r"\d{4}", code):
                continue
            sign = -1 if (isg is not None and "-" in re.sub(r"<[^>]+>", "", str(r[isg]))) else 1
            out[code] = dict(m="T", name=str(r[inm]).strip(), vol=int(num(r[iv]) or 0),
                             o=num(r[io]), h=num(r[ih]), l=num(r[il]), c=num(r[icl]),
                             chg=(num(r[idf]) or 0) * sign)
        return out
    return {}


def twse_margin(d):
    j = get("https://www.twse.com.tw/rwd/zh/marginTrading/MI_MARGN",
            {"response": "json", "date": d, "selectType": "ALL"}, TWSE_GAP)
    if j.get("stat") != "OK":
        return {}
    for t in j.get("tables", []):
        f = t.get("fields") or []
        if "代號" not in f or "現金償還" not in f:
            continue
        ic = f.index("代號")
        ib, isl = fidx(f, exact="買進"), fidx(f, exact="賣出")
        it = fidx(f, exact="今日餘額")
        ilim = fidx(f, "限額")
        its = fidx(f, exact="今日餘額", nth=1)
        out = {}
        for r in t["data"]:
            code = str(r[ic]).strip()
            if not re.fullmatch(r"\d{4}", code):
                continue
            out[code] = dict(mb=num(r[ib]), ms=num(r[isl]), mbal=num(r[it]),
                             mlim=num(r[ilim]) if ilim is not None else None,
                             sbal=num(r[its]) if its is not None else None)
        return out
    return {}


def tpex_tables(url, params):
    return get(url, params, TPEX_GAP).get("tables", [])


def tpex_quotes(d):
    out = {}
    for t in tpex_tables("https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes",
                         {"date": slash(d), "type": "EW", "response": "json"}):
        f = t.get("fields") or []
        if fidx(f, "代號") is None or fidx(f, "收盤") is None:
            continue
        ic, inm, icl, idf = fidx(f, "代號"), fidx(f, "名稱"), fidx(f, "收盤"), fidx(f, "漲跌")
        io, ih, il, iv = fidx(f, "開盤"), fidx(f, "最高"), fidx(f, "最低"), fidx(f, "成交股數")
        for r in t["data"]:
            code = str(r[ic]).strip()
            if not re.fullmatch(r"\d{4}", code):
                continue
            out[code] = dict(m="O", name=str(r[inm]).strip(), vol=int(num(r[iv]) or 0),
                             o=num(r[io]), h=num(r[ih]), l=num(r[il]), c=num(r[icl]),
                             chg=num(r[idf]) or 0)
        if out:
            break
    return out


def tpex_margin(d):
    out = {}
    for t in tpex_tables("https://www.tpex.org.tw/www/zh-tw/margin/balance",
                         {"date": slash(d), "response": "json"}):
        f = t.get("fields") or []
        ic = fidx(f, "代號")
        it = f.index("資餘額") if "資餘額" in f else fidx(f, "今日餘額")
        if ic is None or it is None:
            continue
        ib = fidx(f, exact="資買") if "資買" in f else fidx(f, "資買")
        isl = fidx(f, exact="資賣") if "資賣" in f else fidx(f, "資賣")
        ilim = fidx(f, "資限額") if fidx(f, "資限額") is not None else fidx(f, "限額")
        its = f.index("券餘額") if "券餘額" in f else None
        for r in t["data"]:
            code = str(r[ic]).strip()
            if not re.fullmatch(r"\d{4}", code):
                continue
            out[code] = dict(mb=num(r[ib]) if ib is not None else None,
                             ms=num(r[isl]) if isl is not None else None,
                             mbal=num(r[it]), mlim=num(r[ilim]) if ilim is not None else None,
                             sbal=num(r[its]) if its is not None else None)
        if out:
            break
    return out


COLS = ["date", "m", "code", "name", "o", "h", "l", "c", "chg", "vol", "mb", "ms", "mbal", "mlim", "sbal"]


def day_rows(d):
    q = twse_quotes(d)
    if q is None:          # 非交易日
        return None
    m = twse_margin(d)
    q2 = tpex_quotes(d)
    m2 = tpex_margin(d)
    rows = []
    for qq, mm in ((q, m), (q2, m2)):
        for code, r in qq.items():
            r = dict(r, **mm.get(code, {}))
            r.update(date=d, code=code)
            rows.append([r.get(k) for k in COLS])
    return rows, len(q), len(m), len(q2), len(m2)


def probe(d):
    for name, url, params, gap in [
        ("twse_quotes", "https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX",
         {"response": "json", "date": d, "type": "ALLBUT0999"}, TWSE_GAP),
        ("twse_margin", "https://www.twse.com.tw/rwd/zh/marginTrading/MI_MARGN",
         {"response": "json", "date": d, "selectType": "ALL"}, TWSE_GAP),
        ("tpex_quotes", "https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes",
         {"date": slash(d), "type": "EW", "response": "json"}, TPEX_GAP),
        ("tpex_margin", "https://www.tpex.org.tw/www/zh-tw/margin/balance",
         {"date": slash(d), "response": "json"}, TPEX_GAP)]:
        j = get(url, params, gap)
        print("==", name, j.get("stat"))
        for t in j.get("tables", []):
            f = t.get("fields") or []
            print("  table:", t.get("title"), len(t.get("data") or []))
            print("  fields:", json.dumps(f, ensure_ascii=False))
            for r in (t.get("data") or []):
                if any("映興" in str(x) for x in r):
                    print("  映興:", json.dumps(r, ensure_ascii=False))
    res = day_rows(d)
    print("parsed counts", res[1:])
    for r in res[0]:
        if r[3] and "映興" in r[3]:
            print("parsed 映興:", r)


def fetch(start, end, path):
    d0 = dt.date(int(start[:4]), int(start[4:6]), int(start[6:]))
    d1 = dt.date(int(end[:4]), int(end[4:6]), int(end[6:]))
    n = 0
    miss = []
    with gzip.open(path, "wt", newline="", encoding="utf-8") as fp:
        w = csv.writer(fp)
        w.writerow(COLS)
        d = d0
        while d <= d1:
            if d.weekday() < 5:
                ds = d.strftime("%Y%m%d")
                try:
                    res = day_rows(ds)
                except Exception as e:
                    print("FAIL", ds, e, flush=True)
                    miss.append(ds)
                    res = None
                if res:
                    w.writerows(res[0])
                    n += 1
                    print(ds, *res[1:], flush=True)
                    if min(res[1:]) == 0:
                        miss.append(ds + ":partial")
            d += dt.timedelta(days=1)
    print("days", n, "missing", miss)


if __name__ == "__main__":
    if sys.argv[1] == "probe":
        probe(sys.argv[2])
    else:
        fetch(sys.argv[2], sys.argv[3], sys.argv[4])
