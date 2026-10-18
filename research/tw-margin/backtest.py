"""台股融資維持率／融資去槓桿回測（近 10 年）。

資料
- 加權指數日收盤、上市融資餘額（新台幣十億元）：取自公開 repo
  raylia529/market-indicators-dashboard（來源為證交所歷史報表與 FinMind 的 TWSE 資料，
  近期以證交所 MI_MARGN 覆寫），固定在下方 commit，首次執行自動下載到 data/。
- 各家公布的融資維持率點位：published_points.csv（逐筆附來源）。

輸出
- output/*.csv 與 output/summary.md

執行：python3 research/tw-margin/backtest.py
"""

from pathlib import Path
import urllib.request

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
OUT = ROOT / "output"
SRC_COMMIT = "54afc524479eb65ed80e2e372e33ac03be54ca18"
SRC_BASE = f"https://raw.githubusercontent.com/raylia529/market-indicators-dashboard/{SRC_COMMIT}/data/"
FILES = {"taiex": "taiex.csv", "margin": "taiwan-margin-financing-balance.csv"}

START, END = "2016-10-17", "2026-10-16"  # 近 10 年
HORIZONS = [5, 20, 60, 120, 250]  # 交易日：1 週、1 月、3 月、6 月、1 年
HZ_LABEL = {5: "1週", 20: "1月", 60: "3月", 120: "6月", 250: "1年"}


def load():
    DATA.mkdir(exist_ok=True)
    series = {}
    for key, name in FILES.items():
        path = DATA / name
        if not path.exists():
            urllib.request.urlretrieve(SRC_BASE + name, path)
        s = pd.read_csv(path, parse_dates=["date"]).set_index("date")["value"]
        series[key] = s
    df = pd.concat(series, axis=1, sort=True).dropna()
    df.columns = ["taiex", "margin_bn"]
    df["m10"] = df.margin_bn.pct_change(10) * 100
    df["tdd120"] = (df.taiex / df.taiex.rolling(120, min_periods=20).max() - 1) * 100
    df["mdd120"] = (df.margin_bn / df.margin_bn.rolling(120, min_periods=20).max() - 1) * 100
    for h in HORIZONS:
        df[f"r{h}"] = (df.taiex.shift(-h) / df.taiex - 1) * 100
    # 之後 20 日內最低收盤相對訊號日（再跌幅）
    fwd_min = df.taiex[::-1].rolling(20, min_periods=1).min()[::-1].shift(-1)
    df["mae20"] = (fwd_min / df.taiex - 1) * 100
    return df


def event_rows(df, dates, extra=None):
    rows = []
    last = df.index[-1]
    for i, d in enumerate(dates):
        r = df.loc[d]
        row = {
            "date": d.date(),
            "taiex": round(r.taiex, 2),
            "taiex_dd120_%": round(r.tdd120, 1),
            "margin_bn": round(r.margin_bn, 1),
            "margin_10d_%": round(r.m10, 1),
            "margin_dd120_%": round(r.mdd120, 1),
            "mae20_%": round(r.mae20, 1),
        }
        for h in HORIZONS:
            row[f"r{h}_%"] = None if np.isnan(r[f"r{h}"]) else round(r[f"r{h}"], 1)
        row["to_latest_%"] = round((df.taiex.loc[last] / r.taiex - 1) * 100, 1)
        if extra is not None:
            row.update(extra[i])
        rows.append(row)
    return pd.DataFrame(rows)


def crossings(cond, rearm=20):
    """條件由假轉真、且前 rearm 個交易日皆為假時才算一次新訊號。"""
    out, quiet = [], rearm
    for d, c in cond.items():
        if c and quiet >= rearm:
            out.append(d)
        quiet = 0 if c else quiet + 1
    return out


def stats(ev, label):
    row = {"signal": label, "N": len(ev)}
    for h in HORIZONS:
        s = ev[f"r{h}_%"].dropna()
        row[f"{HZ_LABEL[h]}_平均%"] = round(s.mean(), 1) if len(s) else None
        row[f"{HZ_LABEL[h]}_勝率%"] = round((s > 0).mean() * 100) if len(s) else None
        row[f"{HZ_LABEL[h]}_n"] = len(s)
    row["20日內再跌_平均%"] = round(ev["mae20_%"].mean(), 1)
    row["20日內再跌_最差%"] = round(ev["mae20_%"].min(), 1)
    return row


def baseline(df):
    w = df.loc[START:END]
    row = {"signal": "基準：任意交易日", "N": len(w)}
    for h in HORIZONS:
        s = w[f"r{h}"].dropna()
        row[f"{HZ_LABEL[h]}_平均%"] = round(s.mean(), 1)
        row[f"{HZ_LABEL[h]}_勝率%"] = round((s > 0).mean() * 100)
        row[f"{HZ_LABEL[h]}_n"] = len(s)
    row["20日內再跌_平均%"] = round(w["mae20"].mean(), 1)
    row["20日內再跌_最差%"] = round(w["mae20"].min(), 1)
    return row


def leverage_buildup(df):
    """Q1：上市融資在 2026 年高檔的堆積程度。"""
    m, px = df.margin_bn, df.taiex
    first_40k = px.loc["2026-01-01":][px.loc["2026-01-01":] >= 40000].index[0]
    peak_px = px.loc["2026-06-01":"2026-07-16"].idxmax()
    pts = {
        "2025/4/9 關稅低點": "2025-04-09",
        "2026/4/7": "2026-04-07",
        f"{first_40k:%Y/%-m/%-d} 首次站上4萬": first_40k,
        "2026/5/6": "2026-05-06",
        "2026/6/22 指數收盤高點": peak_px,
        "2026/7/16 崩跌前": "2026-07-16",
        "2026/7/30 波段低點": "2026-07-30",
        "2026/10/16 最新": "2026-10-16",
    }
    rows = [{"點位": k, "日期": pd.Timestamp(v).date(), "加權指數": round(px.loc[v], 2),
             "上市融資餘額_億": round(m.loc[v] * 10, 1)} for k, v in pts.items()]
    t = pd.DataFrame(rows)
    peak = m.loc["2026-07-16"]
    s = df.loc["2026-01-02":"2026-07-16"]
    adds = s.margin_bn.diff().clip(lower=0)  # 以每日淨增加額加權，近似新增融資的進場指數
    notes = {
        "上市融資 2025/4/9→2026/7/16 增幅%": round((peak / m.loc["2025-04-09"] - 1) * 100, 1),
        "2026年以來淨增融資占7/16餘額%": round((peak - s.margin_bn.iloc[0]) / peak * 100, 1),
        "2026年新增融資的加權平均進場指數": round((adds * s.taiex).sum() / adds.sum()),
        "站上4萬後淨增融資占7/16餘額%": round((peak - m.loc[first_40k]) / peak * 100, 1),
        "上市融資 5/6→6/22 增幅%": round((m.loc[peak_px] / m.loc["2026-05-06"] - 1) * 100, 1),
        # 櫃買融資餘額（億）取自新聞：5/6 1937.97（旺得富）、6/22 2084.4（聯合報）
        "上櫃融資 5/6→6/22 增幅%（新聞點位）": round((2084.4 / 1937.97 - 1) * 100, 1),
        "加權 7/16→7/30 跌幅%": round((px.loc["2026-07-30"] / px.loc["2026-07-16"] - 1) * 100, 1),
        "上市融資 7/16→7/30 減幅%": round((m.loc["2026-07-30"] / peak - 1) * 100, 1),
        # 上櫃 7/17 1962.00 億、7/24 1901.62 億（MoneyDJ／櫃買中心）；7/17 上市櫃合計減 416 億、上市減 276.1 億
        "上櫃融資 7/16(推估)→7/24 減幅%": round((1901.62 / (1962.00 + 416 - 276.1) - 1) * 100, 1),
        "上市融資 7/16→7/24 減幅%": round((m.loc["2026-07-24"] / peak - 1) * 100, 1),
    }
    return t, notes


def md(df):
    cols = list(df.columns)
    lines = ["| " + " | ".join(map(str, cols)) + " |", "|" + "---|" * len(cols)]
    for _, r in df.iterrows():
        lines.append("| " + " | ".join("—" if (v is None or (isinstance(v, float) and np.isnan(v))) else str(v) for v in r.values) + " |")
    return "\n".join(lines)


def main():
    OUT.mkdir(exist_ok=True)
    df = load()
    pub = pd.read_csv(ROOT / "published_points.csv", parse_dates=["date"])

    # A. 各次大型去槓桿的維持率波段低點（標準口徑：融資股票市值／融資金額，含 ETF）
    troughs = [
        ("2018/10 中美貿易戰", "2018-10-26", "≈141"),
        ("2020/3 COVID", "2020-03-19", "135.8"),
        ("2022/10 升息空頭", "2022-10-26", "138.7"),
        ("2024/8 日圓套利平倉", "2024-08-05", "≈139（CMoney）"),
        ("2025/4 對等關稅", "2025-04-09", "130.3"),
        ("2026/7 717股災", "2026-07-30", "≈154（FinLab）"),
    ]
    a = event_rows(df, [pd.Timestamp(d) for _, d, _ in troughs],
                   [{"事件": n, "維持率低點%": v} for n, _, v in troughs])
    a = a[["事件", "date", "維持率低點%", "taiex", "taiex_dd120_%", "margin_10d_%", "mae20_%"]
          + [f"r{h}_%" for h in HORIZONS] + ["to_latest_%"]]
    a.to_csv(OUT / "A_trough_events.csv", index=False)

    # B. 規則化進場：維持率「首次收盤跌破 140%」
    first140 = [("2020/3", "2020-03-18", "139.87"), ("2022/10", "2022-10-25", "139.08"),
                ("2024/8", "2024-08-05", "≈139（CMoney）"), ("2025/4", "2025-04-07", "139.68")]
    b = event_rows(df, [pd.Timestamp(d) for _, d, _ in first140],
                   [{"事件": n, "跌破當日維持率%": v} for n, _, v in first140])
    b = b[["事件", "date", "跌破當日維持率%", "taiex", "mae20_%"] + [f"r{h}_%" for h in HORIZONS]]
    b.to_csv(OUT / "B_first_below_140.csv", index=False)

    # C. 系統化回測（實際日資料）：上市融資餘額 10 日減幅
    w = df.loc[START:END]
    c_stats, c_events = [baseline(df)], {}
    for x in [8, 10, 12]:
        dates = crossings(w.m10 <= -x)
        ev = event_rows(df, dates)
        c_events[x] = ev
        ev.to_csv(OUT / f"C_margin10d_le_-{x}.csv", index=False)
        c_stats.append(stats(ev, f"融資10日減幅≥{x}%"))
    # 加上「指數自 120 日高點回檔 ≥15%」濾網
    dates = crossings((w.m10 <= -10) & (w.tdd120 <= -15))
    ev_f = event_rows(df, dates)
    ev_f.to_csv(OUT / "C_margin10d_le_-10_and_dd15.csv", index=False)
    c_stats.append(stats(ev_f, "融資10日減幅≥10% 且 指數回檔≥15%"))
    c = pd.DataFrame(c_stats)
    c.to_csv(OUT / "C_summary.csv", index=False)

    lev_t, lev_notes = leverage_buildup(df)
    lev_t.to_csv(OUT / "Q1_leverage_buildup.csv", index=False)

    keep = ["signal", "N"] + [k for h in [20, 60, 250] for k in (f"{HZ_LABEL[h]}_平均%", f"{HZ_LABEL[h]}_勝率%", f"{HZ_LABEL[h]}_n")] + ["20日內再跌_平均%", "20日內再跌_最差%"]
    ev10 = c_events[10][["date", "taiex", "margin_10d_%", "taiex_dd120_%", "mae20_%", "r20_%", "r60_%", "r250_%", "to_latest_%"]]

    summary = [
        f"# 回測輸出（{START} → {END}，資料最後一日 {df.index[-1].date()}）",
        "", "## A. 維持率波段低點與後續加權指數報酬（%）", "", md(a),
        "", "## B. 首次收盤跌破 140% 進場", "", md(b),
        "", "## C. 上市融資餘額 10 日急縮（實際日資料）", "", md(c[keep]),
        "", "### 融資10日減幅≥10% 個別事件", "", md(ev10),
        "", "## Q1. 上市融資堆積", "", md(lev_t), "",
        *[f"- {k}：{v}" for k, v in lev_notes.items()],
        "", "## 公開維持率點位（口徑：S=融資市值/融資金額含ETF，C=CMoney，K=凱基，X=扣除ETF，O=整戶擔保）", "",
        md(pub.assign(date=pub.date.dt.date)[["date", "market", "method", "value", "source", "note"]]),
    ]
    (OUT / "summary.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print("\n".join(summary))


if __name__ == "__main__":
    main()
