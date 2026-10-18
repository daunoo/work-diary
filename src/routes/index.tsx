import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "上班日记 · 记录每日上班与工资" },
      { name: "description", content: "本地保存的上班打卡日历，支持全天/半天，自动统计月工资与累计工资。" },
      { property: "og:title", content: "上班日记" },
      { property: "og:description", content: "本地保存的上班打卡日历，支持全天/半天，自动统计月工资与累计工资。" },
    ],
  }),
  component: Index,
});

const MONTHS = [
  [2026, 9],
  [2026, 10],
  [2026, 11],
  [2027, 0],
] as const;
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const KEY = "work-diary-v2";
const OLD_KEY = "work-diary-v1";

type DayStatus = "full" | "half";
type Data = { wage: number; days: Record<string, DayStatus> };

const key = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const money = (n: number) =>
  "¥" + n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

/** 统计工资：全天 = 1 份日薪，半天 = 0.5 份日薪 */
const countPay = (days: Record<string, DayStatus>, prefix = "") => {
  let full = 0;
  let half = 0;
  for (const k in days) {
    if (prefix && !k.startsWith(prefix)) continue;
    if (days[k] === "half") half += 1;
    else full += 1;
  }
  return { full, half, amount: (full + half * 0.5) as number };
};

function Index() {
  const [data, setData] = useState<Data>({ wage: 300, days: {} });
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [wageInput, setWageInput] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw));
      else {
        // 旧版本数据迁移：v1 里记录过的日子全部算「全天」
        const old = localStorage.getItem(OLD_KEY);
        if (old) {
          const parsed = JSON.parse(old) as Data & { days: Record<string, unknown> };
          const days: Record<string, DayStatus> = {};
          for (const k in parsed.days) days[k] = "full";
          if (typeof parsed.wage === "number") {
            setData({ wage: parsed.wage, days });
            localStorage.setItem(KEY, JSON.stringify({ wage: parsed.wage, days }));
          }
        }
      }
    } catch {}
    const now = new Date();
    const i = MONTHS.findIndex(([y, m]) => y === now.getFullYear() && m === now.getMonth());
    if (i >= 0) setIdx(i);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, loaded]);

  const [y, m] = MONTHS[idx] ?? MONTHS[0];
  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const todayKey = useMemo(() => {
    const t = new Date();
    return key(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const prefix = `${y}-${String(m + 1).padStart(2, "0")}`;
  const month = countPay(data.days, prefix);
  const all = countPay(data.days);

  /** 点击循环切换：未记录 → 全天 → 半天 → 未记录 */
  const cycle = (k: string) =>
    setData((d) => {
      const days = { ...d.days };
      const cur = days[k];
      if (!cur) days[k] = "full";
      else if (cur === "full") days[k] = "half";
      else delete days[k];
      return { ...d, days };
    });

  const saveWage = () => {
    const n = parseFloat(wageInput);
    if (!isNaN(n) && n >= 0) setData((d) => ({ ...d, wage: n }));
    setEditing(false);
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-muted-foreground">WORK DIARY</p>
          <h1 className="text-3xl font-bold">上班日记</h1>
        </div>
        <button
          onClick={() => {
            setWageInput(String(data.wage));
            setEditing(true);
          }}
          className="rounded-full bg-card px-4 py-2 text-sm shadow-sm ring-1 ring-border"
        >
          日薪 <span className="font-semibold text-primary">{money(data.wage)}</span>
        </button>
      </header>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
          <p className="text-xs opacity-80">
            {m + 1}月工资 · {month.full + month.half}天
            {month.half > 0 ? `（含${month.half}个半天）` : ""}
          </p>
          <p className="mt-1 text-2xl font-bold">{money(month.amount * data.wage)}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">
            累计工资 · {all.full + all.half}天
            {all.half > 0 ? `（含${all.half}个半天）` : ""}
          </p>
          <p className="mt-1 text-2xl font-bold">{money(all.amount * data.wage)}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between">
          <button
            disabled={idx === 0}
            onClick={() => setIdx(idx - 1)}
            className="h-9 w-9 rounded-full bg-muted text-lg disabled:opacity-30"
            aria-label="上个月"
          >
            ‹
          </button>
          <h2 className="text-lg font-semibold">
            {y}年 {m + 1}月
          </h2>
          <button
            disabled={idx === MONTHS.length - 1}
            onClick={() => setIdx(idx + 1)}
            className="h-9 w-9 rounded-full bg-muted text-lg disabled:opacity-30"
            aria-label="下个月"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEK.map((w) => (
            <div key={w} className="pb-1 text-xs text-muted-foreground">{w}</div>
          ))}
          {Array.from({ length: first }).map((_, i) => <div key={"e" + i} />)}
          {Array.from({ length: total }).map((_, i) => {
            const k = key(y, m, i + 1);
            const status = data.days[k];
            return (
              <button
                key={k}
                onClick={() => cycle(k)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition active:scale-90 ${
                  status === "full"
                    ? "bg-primary text-primary-foreground"
                    : status === "half"
                      ? "bg-primary/50 text-primary-foreground"
                      : "bg-muted text-foreground"
                } ${k === todayKey ? "ring-2 ring-ring ring-offset-2 ring-offset-card" : ""}`}
              >
                <span className="font-medium">{i + 1}</span>
                <span className="text-[9px] opacity-80">
                  {status === "full" ? "全天" : status === "half" ? "半天" : "未记录"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          点一下 = 全天，再点一下 = 半天（半份日薪），再点一下取消
        </p>
      </section>

      <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
        数据仅保存在本机
        <br />
        iPhone：Safari 打开 → 分享 → 添加到主屏幕
      </p>

      {editing && (
        <div className="fixed inset-0 z-10 flex items-end bg-foreground/40" onClick={() => setEditing(false)}>
          <div
            className="mx-auto w-full max-w-md rounded-t-3xl bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-semibold">设置日薪（元）</h3>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              value={wageInput}
              onChange={(e) => setWageInput(e.target.value)}
              className="w-full rounded-xl bg-muted px-4 py-3 text-xl outline-none ring-1 ring-border focus:ring-ring"
            />
            <p className="mt-2 text-xs text-muted-foreground">半天按日薪的一半计算。</p>
            <button
              onClick={saveWage}
              className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
