# -*- coding: utf-8 -*-
"""第一根爆量漲停, 依「爆量前安不安靜」「離一年高點多近」分組比較。

使用者觀察: 映興 2021/9/2 那根前面半年震盪很大、離高點遠; 2026/10/5 這根前面很安靜、貼近 52 週高。
用法: python quiet_bt.py
"""
import pandas as pd

import breakout as B
from analyze import dedup
from quiet import feats

F = feats()
E = dedup(B.burst & (B.pct >= 0.095), 60)               # 所有低量股的第一根爆量漲停
near = F["pos"] >= 0.85                                  # 前一天離一年高點 15% 以內
far = F["pos"] < 0.75
calm_l = F["rng120"] <= 0.30                             # 前半年高低差 <= 30%
wild_l = F["rng120"] > 0.40
calm_s = F["rng60"] <= 0.20                              # 前 3 個月高低差 <= 20%
G = {
    "全部第一根爆量漲停": E,
    "前半年安靜(高低差<=30%)": E & calm_l,
    "前3個月安靜(高低差<=20%)": E & calm_s,
    "貼近一年高(15%內)": E & near,
    "貼近高+前半年安靜": E & near & calm_l,
    "貼近高+前3個月安靜": E & near & calm_s,
    "映興2026型: 貼近高+半年安靜+3個月安靜": E & near & calm_l & calm_s,
    "映興2021型: 離高點遠+前半年大震盪": E & far & wild_l,
}
COLS = ["次數", "後續還有漲停", "開盤追20天賺錢", "開盤追20天典型", "開盤追20天平均", "開盤追60天典型",
        "開盤追60天平均", "再漲30%", "再漲50%", "再翻倍", "買了就沒再漲過10%", "曾跌20%",
        "停利停損平均", "停利停損賺錢"]


def show(G, title):
    ev = {k: B.run(S) for k, S in G.items()}
    t = pd.DataFrame([B.summ(e, k) for k, e in ev.items()]).set_index("組別")
    for k in t.columns:
        if k != "次數":
            t[k] = (t[k] * 100).round(1)
    print(title)
    print(t[COLS].T.to_string())
    return ev


if __name__ == "__main__":
    pd.set_option("display.width", 250, "display.max_columns", 40)
    ev = show(G, "== 所有低量股")
    show({k: S & B.watched for k, S in G.items()}, "== 只看融資觀察名單內")
    k = "映興2026型: 貼近高+半年安靜+3個月安靜"
    e = ev[k]
    for lab, lo, hi in [("21-23", "2021", "2023-12-31"), ("24-26", "2024", "2026-12-31")]:
        for kk in ["全部第一根爆量漲停", k]:
            x = ev[kk]
            s = B.summ(x[(x.date >= lo) & (x.date <= hi)], kk)
            print(lab, kk, s["次數"], {q: round(s[q] * 100, 1) for q in COLS[1:] if q in s})
    cols = ["date", "code", "name", "量倍數", "後續連漲停", "延後天數", "開盤追_20", "開盤追_60", "最高", "最低", "停利停損"]
    print(e.sort_values("最高", ascending=False)[cols].head(15).round(3).to_string())
    print(e.sort_values("開盤追_60")[cols].head(8).round(3).to_string())
    print(e[e.date >= "2026-07-01"][cols].round(3).to_string())
