# -*- coding: utf-8 -*-
"""各組比較。用法: python study.py [M20 MUP DOM] [--period] [--save ev.pkl]"""
import sys

import pandas as pd

from analyze import (A, W, dates, dom, events, m20, mup, pos, ret20, summ, table, v, v20, v5,
                     mpct, chg)

M20 = float(sys.argv[1]) if len(sys.argv) > 1 else 0.20
MUP = float(sys.argv[2]) if len(sys.argv) > 2 else 12
DOM = float(sys.argv[3]) if len(sys.argv) > 3 else 0.20

ok = A.notna() & (v20 >= 5)                          # 排除幾乎零成交(20 日均量 <5 張)
low = ok & (v20 < 100)
high = ok & (v20 >= 100)
surge = (m20 >= M20) & (mup >= MUP) & (dom >= DOM)   # 融資持續大買
quiet = (ret20.abs() <= 0.15)                        # 股價還沒發動

G = {}
G["全市場(隨機抽)"] = ok & W["mbal"].notna()
G["低量股(隨機抽)"] = low & W["mbal"].notna()
G["低量+融資減少"] = low & (m20 <= -0.10)
G["低量+融資大買(映興型)"] = low & surge
G["映興型+股價未發動"] = low & surge & quiet
G["正常量+融資大買"] = high & surge
# 先低量融資大買, 之後第一天量破 100 張且收紅 -> 隔天買
was = (low & surge).astype(float).rolling(20, min_periods=1).max().astype(bool)
G["映興型→等量破百張才買"] = was & (v >= 100) & (v.shift(1) < 100) & (chg > 0) & ok

rows, ev = [], {}
for k, S in G.items():
    e = events(S)
    ev[k] = e
    rows.append(summ(e, k, S))
print(f"參數: 融資20日增>={M20:.0%}, 20天內增加天數>={MUP:.0f}, 融資淨增/成交量>={DOM:.0%}")
print(table(rows).to_string())

if "--period" in sys.argv:
    rows = []
    for k in ["低量股(隨機抽)", "低量+融資大買(映興型)", "正常量+融資大買", "映興型→等量破百張才買"]:
        e = ev[k]
        for lo, hi, lab in [("2021", "2022-12-31", "21-22"), ("2023", "2024-12-31", "23-24"),
                            ("2025", "2026-12-31", "25-26")]:
            rows.append(summ(e[(e.date >= lo) & (e.date <= hi)], f"{k} {lab}"))
    print(table(rows).to_string())
if "--save" in sys.argv:
    pd.to_pickle(ev, sys.argv[sys.argv.index("--save") + 1])
