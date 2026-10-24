# -*- coding: utf-8 -*-
"""爆量前「安靜度」與「離一年高點多近」的特徵(都用爆量前一天為止的資料)。"""
from analyze import A, W, c, chg

h, l = W["h"], W["l"]
ref = c - chg
amp = ((h - l) / ref).where(ref > 0)                    # 每日振幅
r = W["r"]


def feats(n=20):
    """回 dict of DataFrame, 每格 = 截至前一天的值"""
    rng = A.rolling(n, min_periods=n).max() / A.rolling(n, min_periods=n).min() - 1
    out = dict(
        rng20=rng,                                       # 近 20 日收盤高低差
        rng60=A.rolling(60, min_periods=60).max() / A.rolling(60, min_periods=60).min() - 1,
        rng120=A.rolling(120, min_periods=120).max() / A.rolling(120, min_periods=120).min() - 1,
        amp20=amp.rolling(n, min_periods=10).mean(),     # 近 20 日平均振幅
        sd20=r.rolling(n, min_periods=10).std(),         # 近 20 日每日漲跌的波動
        pos=A / A.rolling(250, min_periods=120).max(),   # 收盤 / 一年最高收盤
        ret60=A / A.shift(60) - 1,
    )
    return {k: x.shift(1) for k, x in out.items()}
