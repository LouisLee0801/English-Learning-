# -*- coding: utf-8 -*-
"""映興型回測: 低量(20 日均量 <100 張) + 融資持續大買, 之後 20/60 個交易日的表現。

進場 = 訊號日隔天開盤(還原)。同一檔觸發後 20 個交易日內不重複計。
超額 = 個股報酬 − 同期全市場等權平均。
"""
import sys

import numpy as np
import pandas as pd

from load import load

W = load()
A, vol, mbal, c, o, chg = W["A"], W["vol"], W["mbal"], W["c"], W["o"], W["chg"]
alive = A.notna()
v = vol.where(alive).fillna(0).where(alive)
v20 = v.rolling(20, min_periods=20).mean()
v5 = v.rolling(5, min_periods=5).mean()
vsum20 = v.rolling(20, min_periods=20).sum()
mb_ = mbal.where(alive)
m0 = mb_.shift(20)
m20 = (mb_ / m0 - 1).where(m0 >= 50)                 # 融資 20 日增幅(基期至少 50 張)
mup = (mb_.diff() > 0).astype(float).where(mb_.notna()).rolling(20, min_periods=15).sum()
dom = ((mb_ - m0) / vsum20).where(vsum20 > 0)        # 20 日融資淨增 ÷ 20 日成交量
ret20 = A / A.shift(20) - 1
hi250 = A.rolling(250, min_periods=120).max()
pos = A / hi250                                       # 距一年高點
mpct = mb_ / (W["mlim"].where(alive) * 4)             # 融資佔股本

# 結果
ref1 = (c - chg).shift(-1)
entry = (A * (o.shift(-1) / ref1)).where(o.shift(-1).notna() & (ref1 > 0))
entry = entry.fillna(A.shift(-1))                     # 隔天沒開盤價 -> 隔天收盤
mkt_r = W["r"].mean(axis=1).fillna(0)
M = (1 + mkt_r).cumprod()


def fwd(k):
    return A.shift(-k) / entry - 1


def mkt(k):
    return M.shift(-k) / M - 1


B = A.shift(-1)
fmax = B[::-1].rolling(60, min_periods=40).max()[::-1] / entry - 1
fmin = B[::-1].rolling(60, min_periods=40).min()[::-1] / entry - 1
F20, F60 = fwd(20), fwd(60)
X20 = F20.sub(mkt(20), axis=0)
X60 = F60.sub(mkt(60), axis=0)
dates = A.index


def dedup(S, gap=20):
    S = S.fillna(False).astype(bool).values
    out = np.zeros_like(S)
    for j in range(S.shape[1]):
        idx = np.flatnonzero(S[:, j])
        last = -10**9
        for i in idx:
            if i - last > gap:
                out[i, j] = True
                last = i
    return pd.DataFrame(out, index=dates, columns=A.columns)


def events(S):
    E = dedup(S)
    ii, jj = np.nonzero(E.values)
    df = pd.DataFrame({
        "date": dates[ii], "code": A.columns[jj],
        "f20": F20.values[ii, jj], "f60": F60.values[ii, jj],
        "x20": X20.values[ii, jj], "x60": X60.values[ii, jj],
        "mx": fmax.values[ii, jj], "mn": fmin.values[ii, jj],
        "v20": v20.values[ii, jj], "m20": m20.values[ii, jj], "dom": dom.values[ii, jj],
        "ret20": ret20.values[ii, jj], "pos": pos.values[ii, jj], "mpct": mpct.values[ii, jj],
    })
    df["name"] = W["names"].name.reindex(df.code).values
    return df


def summ(df, label, S=None):
    d = df.dropna(subset=["f60", "mx"])
    n = len(d)
    if n == 0:
        return dict(組別=label, 次數=0)
    months = (dates[-1] - dates[0]).days / 30.4
    row = dict(組別=label, 次數=n, 每月新增=round(len(df) / months, 1),
               D20平均=d.f20.mean(), D60平均=d.f60.mean(), D60典型=d.f60.median(),
               D60超額平均=d.x60.mean(), D60超額典型=d.x60.median(),
               賺錢機率=(d.f60 > 0).mean(), 贏大盤機率=(d.x60 > 0).mean(),
               漲30機率=(d.mx >= 0.30).mean(), 妖股50機率=(d.mx >= 0.50).mean(),
               翻倍機率=(d.mx >= 1.0).mean(), 曾跌20機率=(d.mn <= -0.20).mean(),
               D60賠20機率=(d.f60 <= -0.20).mean())
    if S is not None:
        row["每日符合檔數"] = round(S.fillna(False).sum(axis=1)[dates >= dates[260]].mean(), 1)
    return row


def table(rows):
    t = pd.DataFrame(rows).set_index("組別")
    pct = [k for k in t.columns if k not in ("次數", "每月新增", "每日符合檔數")]
    for k in pct:
        t[k] = (t[k] * 100).round(1)
    return t


if __name__ == "__main__":
    pd.set_option("display.width", 250, "display.max_columns", 30)
    code = sys.argv[1] if len(sys.argv) > 1 else "3597"
    cols = dict(c=c[code], vol=vol[code], mbal=mbal[code], mb=W["mb"][code], ms=W["ms"][code],
                v20=v20[code], m20=m20[code], mup=mup[code], dom=dom[code], ret20=ret20[code],
                pos=pos[code], mpct=mpct[code])
    print(pd.DataFrame(cols).loc["2026-07-01":].round(3).to_string())
