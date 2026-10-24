# -*- coding: utf-8 -*-
"""單檔財報/資產負債/月營收(FinMind 免 token, 逐檔查)。在 Actions 上跑。
欄位對應照 alpha-vibe-trader avt/fetch/financials.py INC_MAP/BAL_MAP。
用法: python fetch_fin.py 3597[,2330] out.json
"""
import json
import sys
import time

import requests

API = "https://api.finmindtrade.com/api/v4/data"
DS = ["TaiwanStockFinancialStatements", "TaiwanStockBalanceSheet", "TaiwanStockMonthRevenue"]


def get(ds, code):
    for i in range(5):
        try:
            j = requests.get(API, params={"dataset": ds, "data_id": code, "start_date": "2019-01-01",
                                          "end_date": "2026-12-31"}, timeout=60).json()
            if j.get("status") == 200:
                return j.get("data", [])
            print(ds, code, j.get("msg"), flush=True)
        except Exception as e:
            print(ds, code, e, flush=True)
        time.sleep(10 * (i + 1))
    return None


if __name__ == "__main__":
    out = {}
    for code in sys.argv[1].split(","):
        out[code] = {ds: get(ds, code) for ds in DS}
        for ds in DS:
            print(code, ds, len(out[code][ds] or []), flush=True)
        time.sleep(1)
    json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
