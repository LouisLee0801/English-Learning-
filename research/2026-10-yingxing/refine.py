# -*- coding: utf-8 -*-
"""映興型的加碼濾網: 哪些條件能讓「中妖股」的比例明顯變高?"""
import pandas as pd

from analyze import A, W, events, summ, table, v, v20, m20, mup, dom, pos, ret20, mpct, chg, o, c

ok = A.notna() & (v20 >= 5)
low = ok & (v20 < 100)
base = low & (m20 >= 0.08) & (mup >= 14) & (dom >= 0.10)
days = (W["mbal"] / v20).where(v20 > 0)              # 融資餘額 = 幾天的成交量
G = {
    "映興型(基本)": base,
    "+融資天數>=16/20": base & (mup >= 16),
    "+融資20日增>=20%": base & (m20 >= 0.20),
    "+融資淨增>=成交量3成": base & (dom >= 0.30),
    "+距一年高<15%": base & (pos >= 0.85),
    "+距一年高>=30%(低檔)": base & (pos < 0.70),
    "+融資餘額>=20天量": base & (days >= 20),
    "+融資佔股本>=2%": base & (mpct >= 0.02),
    "+股價<30元": base & (c.ffill() < 30),
    "映興全套(近高+融資卡20天量+佔股本2%)": base & (pos >= 0.85) & (days >= 20) & (mpct >= 0.02),
}
rows, ev = [], {}
for k, S in G.items():
    e = events(S)
    ev[k] = e
    rows.append(summ(e, k, S))
t = table(rows)
print(t[["次數", "每月新增", "每日符合檔數", "D60平均", "D60超額平均", "D60超額典型", "賺錢機率", "漲30機率", "妖股50機率", "翻倍機率", "曾跌20機率"]].to_string())
