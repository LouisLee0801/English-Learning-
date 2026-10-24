# -*- coding: utf-8 -*-
"""小型營收成長股名單(不看成交量)回測。

名單(每月營收申報期限 10 日之後的第一個交易日更新, 用最新一個月營收):
  小型      去年同月營收 3,000 萬 ~ 1 億(alpha-vibe-trader 月營收榜的 1 億門檻擋掉的那群)
  高成長    最近 N 個月營收年增都 >= G
  創新高    當月營收 >= 前 11 個月最高(近 12 個月新高)
進場: 名單內的股票, 第一天收盤距一年最高收盤(還原價) <= X% -> 隔天開盤買(一字漲停順延)。
同一檔 60 個交易日內只算一次。出場口徑同 breakout.py(固定抱 20/60 天; 停利停損)。
成本: 手續費 0.1425% x2 + 證交稅 0.3% = 0.585%(不含滑價)。
用法: python revlist.py
"""
import glob
import os

import numpy as np
import pandas as pd

import breakout as B
from analyze import A, pos

HERE = os.path.dirname(os.path.abspath(__file__))
COST = 0.00585


def load_rev():
    fs = sorted(glob.glob(os.path.join(HERE, "data", "rev_*.csv.gz")))
    df = pd.concat([pd.read_csv(f, dtype={"code": str, "ym": str}) for f in fs])
    df = df.drop_duplicates(["code", "ym"], keep="last")
    R = df.pivot(index="ym", columns="code", values="revenue").sort_index()
    idx = pd.period_range(R.index[0][:4] + "-" + R.index[0][4:], R.index[-1][:4] + "-" + R.index[-1][4:], freq="M")
    R.index = pd.PeriodIndex([f"{x[:4]}-{x[4:]}" for x in R.index], freq="M")
    return R.reindex(idx)


R = load_rev()
R = R[[c for c in R.columns if c in A.columns]]
LY = R.shift(12)
YOY = R / LY - 1
HI12 = R >= R.shift(1).rolling(11, min_periods=11).max()
DAYS = A.index


def avail(p):
    """p 月營收可以用的第一天: 次月 10 日之後的第一個交易日。"""
    d = (p + 1).to_timestamp() + pd.Timedelta(days=10)
    i = DAYS.searchsorted(d)
    return i if i < len(DAYS) else None


def member(n=3, g=0.20, base_lo=3e7, base_hi=1e8, hi12=True):
    """date x code 的名單成員(布林)。"""
    ok = (LY >= base_lo) & (LY < base_hi)
    cond = ok & (YOY >= g)
    strk = cond.astype(int).rolling(n, min_periods=n).sum() >= n
    if hi12:
        strk &= HI12
    M = np.zeros(A.shape, dtype=bool)
    cols = A.columns.get_indexer(strk.columns)
    ps = list(strk.index)
    for k, p in enumerate(ps):
        i0 = avail(p)
        if i0 is None:
            continue
        i1 = avail(ps[k + 1]) if k + 1 < len(ps) else len(DAYS)
        i1 = len(DAYS) if i1 is None else i1
        hit = strk.loc[p].values
        M[i0:i1, cols[hit]] = True
    return pd.DataFrame(M, index=DAYS, columns=A.columns)


def first_day(M):
    """名單成員資格開始的那一天(前一天不是成員)。"""
    return M & ~M.shift(1, fill_value=False)


COLS = ["次數", "開盤追20天賺錢", "開盤追20天典型", "開盤追20天平均", "開盤追60天典型", "開盤追60天平均",
        "再漲30%", "再漲50%", "曾跌20%", "停利停損平均", "停利停損賺錢"]


def table(G):
    ev, rows = {}, []
    for k, S in G.items():
        e = B.run(S)
        ev[k] = e
        rows.append(B.summ(e, k))
    t = pd.DataFrame(rows).set_index("組別")
    for k in t.columns:
        if k != "次數":
            t[k] = (t[k] * 100).round(1)
    return t, ev


def net(e, col):
    d = e[e.完整60天]
    return d[col] - COST


if __name__ == "__main__":
    pd.set_option("display.width", 250, "display.max_columns", 40)
    near = {x: pos >= 1 - x for x in (0.10, 0.15, 0.20)}
    Mm = member()
    G = {
        "名單(營收條件)當天就買": first_day(Mm),
        "名單+距52W高<=20%": Mm & near[0.20],
        "名單+距52W高<=15%": Mm & near[0.15],
        "名單+距52W高<=10%": Mm & near[0.10],
        "大型同條件(去年同月>=1億)+距高<=15%": member(base_lo=1e8, base_hi=1e15) & near[0.15],
        "對照: 小型股隨便挑+距高<=15%": member(n=1, g=-9, hi12=False) & near[0.15],
        "對照: 全市場隨便挑": A.notna(),
    }
    t, ev = table(G)
    print(t[COLS].T.to_string())
    k = "名單+距52W高<=15%"
    e = ev[k]
    print("\n映興:", e[e.code == "3597"][["date", "延後天數", "開盤追_20", "最高", "最低", "停利停損"]].to_string())
    d = e[e.完整60天].copy()
    d["年"] = d.date.dt.year
    y = d.groupby("年").agg(次數=("code", "size"), 停利停損扣成本=("停利停損", lambda s: round((s - COST).mean() * 100, 1)),
                           停利停損典型=("停利停損", lambda s: round((s - COST).median() * 100, 1)),
                           抱60天扣成本=("開盤追_60", lambda s: round((s - COST).mean() * 100, 1)),
                           賺錢比例=("停利停損", lambda s: round((s > COST).mean() * 100, 1)))
    print(y.to_string())
    print("扣成本後每筆: 停利停損 %.2f%%  抱60天 %.2f%%" % (net(e, "停利停損").mean() * 100, net(e, "開盤追_60").mean() * 100))
    from analyze import v20
    lv = v20.values[A.index.get_indexer(d.date), A.columns.get_indexer(d.code)]
    print("進場前 20 日均量: <100 張 %.0f%%, 100~500 張 %.0f%%, >=500 張 %.0f%%"
          % ((lv < 100).mean() * 100, ((lv >= 100) & (lv < 500)).mean() * 100, (lv >= 500).mean() * 100))
    x = d["停利停損"] - COST
    top = x.sort_values(ascending=False)
    print("拿掉最好的 5 筆後每筆平均 %.2f%%; 最好 5 筆貢獻 %.0f%% 的總獲利" % (top.iloc[5:].mean() * 100, top.iloc[:5].sum() / x.sum() * 100))
    if "--grid" in __import__("sys").argv:
        rows = []
        for n in (2, 3, 4):
            for g in (0.15, 0.20, 0.30):
                for h in (True, False):
                    e2 = B.run(member(n=n, g=g, hi12=h) & near[0.15])
                    s2 = B.summ(e2, f"連{n}月>={g:.0%} 近12月新高={'要' if h else '不要'}")
                    d2 = e2[e2.完整60天]
                    s2["扣成本停利停損"] = (d2.停利停損 - COST).mean()
                    s2["含映興"] = "3597" in set(e2.code)
                    rows.append(s2)
        t2 = pd.DataFrame(rows).set_index("組別")
        for k2 in ["開盤追20天賺錢", "開盤追60天平均", "再漲50%", "曾跌20%", "停利停損平均", "停利停損賺錢", "扣成本停利停損"]:
            t2[k2] = (t2[k2] * 100).round(1)
        print(t2[["次數", "含映興", "開盤追20天賺錢", "開盤追60天平均", "再漲50%", "曾跌20%", "停利停損賺錢", "扣成本停利停損"]].to_string())
    cols = ["date", "code", "name", "開盤追_20", "開盤追_60", "最高", "最低", "停利停損"]
    print(e.sort_values("最高", ascending=False)[cols].head(12).round(3).to_string())
    print(e[e.date >= "2026-06-01"][cols].round(3).to_string())
