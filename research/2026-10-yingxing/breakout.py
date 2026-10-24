# -*- coding: utf-8 -*-
"""觀察名單(映興型)出現「第一根突然爆量」時追進去, 之後會怎樣。

觀察名單 = 映興型訊號(低量 + 融資天天加)在爆量日之前 WIN 個交易日內出現過。
爆量日   = 當日量 >= MULT x 前 20 日均量, 且 >= 100 張, 且上漲(依型態分):
           漲停型  收盤漲幅 >= 9.5%(映興 10/5 那根)
           長紅型  收盤漲幅 >= 5%
同一檔只算觀察期內的第一根。
進場: (a) 爆量當天收盤追  (b) 隔天開盤追; 隔天若一字漲停買不到, 順延到第一個買得到的日子開盤。
用法: python breakout.py [WIN] [MULT]
"""
import sys

import numpy as np
import pandas as pd

from analyze import A, W, c, chg, dedup, m20, mup, dom, o, v, v20

_args = [a for a in sys.argv[1:] if a.replace(".", "", 1).isdigit()] if __name__ == "__main__" else []
WIN = int(_args[0]) if len(_args) > 0 else 20
MULT = float(_args[1]) if len(_args) > 1 else 5.0

h, l = W["h"], W["l"]
ref = c - chg
pct = (chg / ref).where(ref > 0)
lock = (o == h) & (h == l) & (pct >= 0.09)              # 一字漲停, 買不到
ok = A.notna() & (v20 >= 5)
low = ok & (v20 < 100)
watch_sig = low & (m20 >= 0.08) & (mup >= 14) & (dom >= 0.10)
watched = watch_sig.shift(1).astype(float).rolling(WIN, min_periods=1).max().fillna(0).astype(bool)
pv20 = v.shift(1).rolling(20, min_periods=20).mean()
was_low = (pv20 < 100) & (pv20 >= 5)
burst = (v >= MULT * pv20) & (v >= 100) & was_low & A.notna()

Av, ov, refv, lockv = A.values, o.values, ref.values, lock.fillna(False).values
pctv = pct.values
T = len(A.index)


def run(S, gap=60):
    E = dedup(S, gap)
    rows = []
    for i, j in zip(*np.nonzero(E.values)):
        if i + 1 >= T:
            continue
        e_close = Av[i, j]
        k = i + 1
        while k < T and lockv[k, j]:
            k += 1
        if k >= T or np.isnan(ov[k, j]) or not refv[k, j] > 0:
            continue
        e_open = Av[k - 1, j] * ov[k, j] / refv[k, j]
        seg = Av[k:min(i + 61, T), j]                    # 進場日起到爆量後第 60 天
        n_lu = 0                                          # 爆量後連續收漲停天數
        while i + 1 + n_lu < T and pctv[i + 1 + n_lu, j] >= 0.095:
            n_lu += 1

        def at(n, base):
            return Av[i + n, j] / base - 1 if i + n < T else np.nan

        # 出場規則: 收盤從進場後最高點回落 15% 或 跌破進場價 10% 就賣, 最多抱 60 天
        ex = np.nan
        if i + 60 < T:
            hi = e_open
            for p in seg:
                hi = max(hi, p)
                if p <= hi * 0.85 or p <= e_open * 0.90:
                    ex = p / e_open - 1
                    break
            else:
                ex = seg[-1] / e_open - 1
        rows.append(dict(
            date=A.index[i], code=A.columns[j], 當天漲幅=pctv[i, j], 量倍數=v.values[i, j] / pv20.values[i, j],
            後續連漲停=n_lu, 延後天數=k - (i + 1),
            收盤追_5=at(5, e_close), 收盤追_20=at(20, e_close), 收盤追_60=at(60, e_close),
            開盤追_進場溢價=e_open / e_close - 1,
            開盤追_5=at(5, e_open), 開盤追_20=at(20, e_open), 開盤追_60=at(60, e_open),
            最高=np.nanmax(seg) / e_open - 1 if len(seg) else np.nan,
            最低=np.nanmin(seg) / e_open - 1 if len(seg) else np.nan,
            停利停損=ex, 完整60天=i + 60 < T))
    df = pd.DataFrame(rows)
    if len(df):
        df["name"] = W["names"].name.reindex(df.code).values
    return df


def summ(df, label):
    d = df[df.完整60天]
    n = len(d)
    if n == 0:
        return dict(組別=label, 次數=0)
    return {"組別": label, "次數": n, "後續還有漲停": (d.後續連漲停 >= 1).mean(),
            "隔天買不到": (d.延後天數 > 0).mean(), "隔天開盤比昨收貴": d.開盤追_進場溢價.median(),
            "收盤追20天平均": d.收盤追_20.mean(), "收盤追20天典型": d.收盤追_20.median(),
            "開盤追5天平均": d.開盤追_5.mean(), "開盤追20天平均": d.開盤追_20.mean(),
            "開盤追20天典型": d.開盤追_20.median(), "開盤追20天賺錢": (d.開盤追_20 > 0).mean(),
            "開盤追60天平均": d.開盤追_60.mean(), "開盤追60天典型": d.開盤追_60.median(),
            "再漲30%": (d.最高 >= 0.30).mean(), "再漲50%": (d.最高 >= 0.50).mean(),
            "再翻倍": (d.最高 >= 1.0).mean(), "買了就沒再漲過10%": (d.最高 < 0.10).mean(),
            "曾跌20%": (d.最低 <= -0.20).mean(),
            "停利停損平均": d.停利停損.mean(), "停利停損典型": d.停利停損.median(),
            "停利停損賺錢": (d.停利停損 > 0).mean()}


if __name__ == "__main__":
    pd.set_option("display.width", 250, "display.max_columns", 40)
    lu, red = burst & (pct >= 0.095), burst & (pct >= 0.05)
    G = {
        "觀察名單+爆量漲停(映興型)": watched & lu,
        "觀察名單+爆量長紅>=5%": watched & red,
        "其他低量股+爆量漲停": ~watched & lu,
        "其他低量股+爆量長紅>=5%": ~watched & red,
    }
    ev = {k: run(S) for k, S in G.items()}
    t = pd.DataFrame([summ(e, k) for k, e in ev.items()]).set_index("組別")
    for k in t.columns:
        if k not in ("次數",):
            t[k] = (t[k] * 100).round(1)
    print(f"觀察期 {WIN} 天, 爆量 >= {MULT:g} 倍")
    print(t.T.to_string())
    e = ev["觀察名單+爆量漲停(映興型)"]
    cols = ["date", "code", "name", "量倍數", "後續連漲停", "延後天數", "開盤追_進場溢價", "開盤追_20", "開盤追_60", "最高", "最低", "停利停損"]
    print(e.sort_values("date")[cols].round(3).to_string())  # noqa
    for lab, (lo, hi) in {"21-22": ("2021", "2022-12-31"), "23-24": ("2023", "2024-12-31"),
                          "25-26": ("2025", "2026-12-31")}.items():
        for k in ["觀察名單+爆量長紅>=5%", "其他低量股+爆量長紅>=5%"]:
            x = ev[k]
            s = summ(x[(x.date >= lo) & (x.date <= hi)], f"{k} {lab}")
            print(lab, k, s.get("次數"), {q: round(s[q] * 100, 1) for q in ["開盤追20天平均", "開盤追20天典型", "開盤追20天賺錢", "再漲50%", "曾跌20%", "停利停損平均"] if q in s})
