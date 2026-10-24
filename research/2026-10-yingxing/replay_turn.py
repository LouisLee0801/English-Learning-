# -*- coding: utf-8 -*-
"""用 alpha-vibe-trader 自己的函式, 逐個時間點重演映興(3597)會不會被抓到。

每個時間點建一個只含 3597 的暫存 DB(只放「當天已公布」的財報/月營收/行情),
直接呼叫 avt.revenue / avt.turnaround 的原函式, 不另寫判斷邏輯。
用法: AVT_ROOT=/path/to/alpha-vibe-trader python replay_turn.py <暫存資料夾>
"""
import datetime as dt
import json
import os
import sqlite3
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCR = sys.argv[1]
os.environ.setdefault("AVT_DATA_DIR", SCR)
os.environ.setdefault("AVT_DB_PATH", os.path.join(SCR, "boot.db"))
sys.path.insert(0, os.environ.get("AVT_ROOT", "/home/user/alpha-vibe-trader"))
from avt import config as C, db, revenue as R, turnaround as TA   # noqa: E402
from avt.fetch.financials import INC_MAP, BAL_MAP, _pivot_stock, date_to_quarter  # noqa: E402

sys.path.insert(0, HERE)
from load import load  # noqa: E402

CODE = "3597"
J = json.load(open(os.path.join(HERE, "data", "fin_3597.json"), encoding="utf-8"))[CODE]
W = load()
DEADLINE = {1: (5, 15), 2: (8, 14), 3: (11, 14), 4: (3, 31)}


def q_deadline(q):
    y, n = int(q[:4]), int(q[5])
    m, d = DEADLINE[n]
    return dt.date(y + (1 if n == 4 else 0), m, d)


inc = _pivot_stock(J["TaiwanStockFinancialStatements"], INC_MAP)
bal = _pivot_stock(J["TaiwanStockBalanceSheet"], BAL_MAP)
def m_deadline(y, m):          # 月營收法定申報期限: 次月 10 日
    return dt.date(y + (m == 12), m % 12 + 1, 10)


MR = [(f"{x['revenue_year']:04d}{x['revenue_month']:02d}", int(x["revenue"]),
       m_deadline(int(x["revenue_year"]), int(x["revenue_month"]))) for x in J["TaiwanStockMonthRevenue"]]


def build(asof):
    path = os.path.join(SCR, f"t_{asof}.db")
    if os.path.exists(path):
        os.remove(path)
    C.DB_PATH = db.DB_PATH = path
    c = db.conn()
    d = dt.date(int(asof[:4]), int(asof[4:6]), int(asof[6:]))
    for q, v in inc.items():
        if q_deadline(q) > d:
            continue
        rev, gp = v.get("revenue"), v.get("gross_profit")
        c.execute("INSERT INTO fin_statement(code,quarter,revenue,gross_profit,gross_margin,op_income,net_income,eps)"
                  " VALUES (?,?,?,?,?,?,?,?)",
                  (CODE, q, rev, gp, round(gp / rev * 100, 2) if rev and gp is not None else None,
                   v.get("op_income"), v.get("net_income"), v.get("eps")))
    for q, v in bal.items():
        if q_deadline(q) > d:
            continue
        cap, eq, ret = v.get("capital"), v.get("equity"), v.get("retained")
        c.execute("INSERT INTO balance_sheet(code,quarter,capital,equity,bps,acc_deficit) VALUES (?,?,?,?,?,?)",
                  (CODE, q, cap, eq, round(eq / (cap / 10), 2) if eq and cap else None,
                   int(ret) if ret is not None and ret < 0 else 0))
    for ym, rev, ct in MR:
        if ct <= d:
            c.execute("INSERT INTO monthly_revenue(code,ym,revenue) VALUES (?,?,?)", (CODE, ym, rev))
    px = W["c"][CODE].dropna()
    for t, close in px[px.index <= str(d)].items():
        vol = int(W["vol"].at[t, CODE] * 1000)
        c.execute("INSERT INTO daily_price(date,market,code,name,volume,amount,open,high,low,close,change)"
                  " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                  (t.strftime("%Y%m%d"), "TPEX", CODE, "映興", vol, int(vol * close),
                   W["o"].at[t, CODE], W["h"].at[t, CODE], W["l"].at[t, CODE], close, W["chg"].at[t, CODE]))
    c.execute("INSERT INTO company(code,name,market,industry) VALUES (?,?,?,?)", (CODE, "映興", "TPEX", "28"))
    c.commit()
    return c


CHECK = [("20250814", "2025Q2", "202507"), ("20251114", "2025Q3", "202510"),
         ("20260331", "2025Q4", "202602"), ("20260515", "2026Q1", "202604"),
         ("20260610", "2026Q1", "202605"), ("20260710", "2026Q1", "202606"),
         ("20260814", "2026Q2", "202607"), ("20260910", "2026Q2", "202608"),
         ("20261012", "2026Q2", "202609")]

if __name__ == "__main__":
    for asof, q, ym in CHECK:
        c = build(asof)
        eps = dict(c.execute("SELECT quarter, eps FROM fin_statement").fetchall())
        ts = [x for x in R.turnaround_screener(c, ym, q, min_score=0) if x["code"] == CODE]
        fc = [x for x in R.next_quarter_forecast(c, ym, q) if x["code"] == CODE]
        tm = TA.turn_metrics(c, q).get(CODE)
        br = TA.be_ratio(c, q, {CODE}).get(CODE) or {}
        mt = R.monthly_tracker(c, ym)
        inlists = [k for k in ("growth", "turn_positive", "new_high") if any(x["code"] == CODE for x in mt[k])]
        m = R.rev_metrics(c, ym).get(CODE) or {}
        vol = c.execute("SELECT volume FROM daily_price ORDER BY date DESC LIMIT 1").fetchone()[0] / 1000
        yago = c.execute("SELECT revenue FROM monthly_revenue WHERE ym=?", (R._year_ago(ym),)).fetchone()
        pmax = c.execute("SELECT MAX(revenue) FROM monthly_revenue WHERE substr(ym,5,2)=? AND ym<?",
                         (ym[4:], ym)).fetchone()[0]
        cur = c.execute("SELECT revenue FROM monthly_revenue WHERE ym=?", (ym,)).fetchone()
        print(f"== {asof} 財報季 {q}  EPS 本季 {eps.get(q)} / 上季 {eps.get(TA.qadd(q, -1))} / 去年同季 {eps.get(TA.qadd(q, -4))}")
        print(f"   轉虧為盈候選: {'有' if ts else '沒有'}  下季轉正預測: {'有' if fc else '沒有'}  "
              f"轉機確認型態: {tm['kind'] + ('·符合配方' if tm['recipe'] else '·不符配方') if tm else '無(沒有翻正)'}  "
              f"打平比: {br.get('ratio')}")
        print(f"   月營收 {ym}: {cur[0] / 1e6 if cur else None:.1f} 百萬, 年增 {m.get('yoy')}%, "
              f"創同月新高 {bool(cur and pmax and cur[0] > pmax)}; 月營收榜 {inlists or '沒上榜'} "
              f"(最近成交量 {vol:.0f} 張 {'≤' if vol <= C.REV_MIN_VOLUME_LOTS else '>'} 100 張; "
              f"去年同月營收 {yago[0] / 1e6 if yago else 0:.1f} 百萬 {'<' if (yago[0] if yago else 0) < C.REV_MIN_BASE_REVENUE else '≥'} 1 億)")
        c.close()
