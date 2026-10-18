# -*- coding: utf-8 -*-
"""讀 data/px_*.csv.gz -> 寬表(日期 x 代號) + 還原報酬指數。"""
import glob
import os

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))


def load():
    cache = os.path.join(HERE, "data", "panel.pkl")
    if os.path.exists(cache):
        return pd.read_pickle(cache)
    fs = sorted(glob.glob(os.path.join(HERE, "data", "px_*.csv.gz")))
    df = pd.concat([pd.read_csv(f, dtype={"code": str, "date": str}) for f in fs])
    df = df[~df.code.str.startswith("0")]            # 排除 ETF
    df = df.drop_duplicates(["date", "code"], keep="last")
    df["date"] = pd.to_datetime(df.date)
    names = df.sort_values("date").groupby("code")[["name", "m"]].last()
    W = {}
    for k in ["o", "h", "l", "c", "chg", "vol", "mb", "ms", "mbal", "mlim"]:
        W[k] = df.pivot(index="date", columns="code", values=k).sort_index()
    W["vol"] = W["vol"] / 1000.0                      # 股 -> 張
    c, chg = W["c"], W["chg"]
    ref = c - chg                                      # 參考價(除權息日已調整)
    r = (chg / ref).where(c.notna() & (ref > 0))
    r = r.where(r.abs() < 0.30)                        # 新上市首日等異常值丟掉
    W["r"] = r
    A = (1 + r.fillna(0)).cumprod()
    # 尚未上市 / 已下市的日子 A 設 NaN
    alive = c.notna().cumsum() > 0
    last = c.notna()[::-1].cumsum()[::-1] > 0
    W["A"] = A.where(alive & last)
    W["names"] = names
    pd.to_pickle(W, cache)
    return W
