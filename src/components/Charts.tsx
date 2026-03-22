"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { CategoryBreakdown, MonthlyData } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/categorizer";
import { getCategoryEmoji } from "@/lib/category-emoji";

function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    check();
    let timeout: ReturnType<typeof setTimeout>;
    const debounced = () => { clearTimeout(timeout); timeout = setTimeout(check, 150); };
    window.addEventListener("resize", debounced);
    return () => { window.removeEventListener("resize", debounced); clearTimeout(timeout); };
  }, [breakpoint]);
  return mobile;
}

/* Fallback palette for categories not in CATEGORY_COLORS */
const FALLBACK_COLORS = [
  "#93c5fd", "#fbbf24", "#c4b5fd", "#86efac", "#fca5a5",
  "#a5b4fc", "#fdba74", "#67e8f9", "#f0abfc", "#fde68a",
];

function getCategoryColor(category: string, index: number): string {
  return CATEGORY_COLORS[category] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export const SUB_COLORS = ["#60a5fa","#f472b6","#34d399","#fbbf24","#a78bfa","#fb923c","#22d3ee","#f87171","#4ade80","#e879f9"];

const TOOLTIP_STYLE = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
} as const;

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* Radial label for donut charts */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRadialLabel(opts: { offset?: number; minPct?: number; showEmoji?: boolean }) {
  const { offset = 22, minPct = 3, showEmoji = false } = opts;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = (outerRadius || 100) + offset;
    const x = (cx || 0) + radius * Math.cos(-(midAngle || 0) * RADIAN);
    const y = (cy || 0) + radius * Math.sin(-(midAngle || 0) * RADIAN);
    const pct = Math.round((percent || 0) * 100);
    if (pct < minPct) return null;
    const prefix = showEmoji ? `${getCategoryEmoji(name)} ` : "";
    return (
      <text x={x} y={y} fill="#64748b" textAnchor={x > (cx || 0) ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600}>
        {prefix}{name} {pct}%
      </text>
    );
  };
}

const renderCustomLabel = makeRadialLabel({ offset: 22, minPct: 3, showEmoji: true });

/* ─── Expense Breakdown (Donut) ─── */
export function ExpenseBreakdownChart({
  categoryBreakdown,
  onCategoryClick,
}: {
  categoryBreakdown: CategoryBreakdown[];
  onCategoryClick?: (category: string) => void;
}) {
  const isMobile = useIsMobile();
  if (categoryBreakdown.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--catto-slate-100)] text-center text-[var(--catto-slate-400)]">
        No expense data to display
      </div>
    );
  }
  const pieData = categoryBreakdown.map((c, i) => ({
    name: c.category,
    value: c.total,
    fill: getCategoryColor(c.category, i),
  }));
  const total = pieData.reduce((s, e) => s + e.value, 0);

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-[var(--catto-slate-100)]" aria-label="Expense breakdown chart">
      <h2 className="text-xl font-bold text-[var(--catto-slate-900)] mb-4 sm:mb-6">Expense Breakdown</h2>
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 320}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={isMobile ? 48 : 65}
            outerRadius={isMobile ? 78 : 100}
            paddingAngle={2}
            dataKey="value"
            label={isMobile ? false : renderCustomLabel}
            labelLine={false}
            onClick={(_data, index) => onCategoryClick?.(pieData[index].name)}
            className="cursor-pointer"
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Mobile: color legend grid below chart */}
      {isMobile && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {pieData.map((entry, index) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            if (pct < 1) return null;
            return (
              <button
                key={index}
                onClick={() => onCategoryClick?.(entry.name)}
                className="flex items-center gap-1.5 text-left py-0.5 active:opacity-70"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                <span className="text-xs font-medium text-slate-600 truncate">
                  {getCategoryEmoji(entry.name)} {entry.name} {pct}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Category Bar Chart ─── */
export function CategoryBarChart({
  categoryBreakdown,
  onCategoryClick,
}: {
  categoryBreakdown: CategoryBreakdown[];
  onCategoryClick?: (category: string) => void;
}) {
  const isMobile = useIsMobile();
  if (categoryBreakdown.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--catto-slate-100)] text-center text-[var(--catto-slate-400)]">
        No spending data to display
      </div>
    );
  }
  const barData = categoryBreakdown.map((c, i) => ({
    name: isMobile ? getCategoryEmoji(c.category) : `${getCategoryEmoji(c.category)} ${c.category}`,
    fullName: c.category,
    total: c.total,
    fill: getCategoryColor(c.category, i),
  }));

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-[var(--catto-slate-100)]" aria-label="Spending per category chart">
      <h2 className="text-xl font-bold text-[var(--catto-slate-900)] mb-4 sm:mb-6">Spending per Category</h2>
      <ResponsiveContainer width="100%" height={isMobile ? 260 : 320}>
        <BarChart data={barData} margin={{ bottom: isMobile ? 10 : 90 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: isMobile ? 16 : 11, fill: "#94a3b8" }}
            angle={isMobile ? 0 : -40}
            textAnchor={isMobile ? "middle" : "end"}
            height={isMobile ? 36 : 100}
            interval={0}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={isMobile ? 50 : 65} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(_label, payload) => {
              const entry = payload?.[0]?.payload as { fullName?: string } | undefined;
              const cat = entry?.fullName || String(_label);
              return `${getCategoryEmoji(cat)} ${cat}`;
            }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} onClick={(_data, index) => onCategoryClick?.(barData[index].fullName)} className="cursor-pointer">
            {barData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Subcategory Donut Chart ─── */

const renderSubcategoryLabel = makeRadialLabel({ offset: 18, minPct: 4 });

export function SubcategoryDonutChart({
  subcategories,
  categoryName,
  onSubcategoryClick,
}: {
  subcategories: { name: string; total: number; count: number; pct: number }[];
  categoryName: string;
  onSubcategoryClick?: (subcategory: string) => void;
}) {
  const isMobile = useIsMobile();

  if (subcategories.length === 0) {
    return (
      <div className="text-center text-sm text-[var(--catto-slate-400)] py-4">
        No subcategory data
      </div>
    );
  }
  const pieData = subcategories.map((s, i) => ({
    name: s.name,
    value: s.total,
    fill: SUB_COLORS[i % SUB_COLORS.length],
  }));

  return (
    <div aria-label={`${categoryName} subcategory breakdown chart`}>
      <h4 className="text-sm font-bold text-[var(--catto-slate-700)] mb-3">
        {getCategoryEmoji(categoryName)} Subcategory Breakdown
      </h4>
      <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            label={isMobile ? false : renderSubcategoryLabel}
            labelLine={false}
            onClick={(_data, index) => onSubcategoryClick?.(pieData[index].name)}
            className="cursor-pointer"
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>
      {isMobile && (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {pieData.map((entry, i) => (
            <button key={i} onClick={() => onSubcategoryClick?.(entry.name)} className="flex items-center gap-1.5 text-left py-0.5 cursor-pointer">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
              <span className="text-xs font-medium text-[var(--catto-slate-600)] truncate">{entry.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Monthly Spending Trend ─── */

export function SpendingTrendChart({
  monthlyData,
}: {
  monthlyData: MonthlyData[];
}) {
  const timelineData = monthlyData.map((m) => ({
    ...m,
    monthLabel: new Date(m.month + "-01").toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
  }));

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-[var(--catto-slate-100)]" aria-label="Monthly spending trend chart">
      <h2 className="text-lg sm:text-xl font-bold text-[var(--catto-slate-900)] mb-4 sm:mb-6">Monthly Spending Trend 📊</h2>
      <ResponsiveContainer width="100%" height={300}>
        {timelineData.length <= 1 ? (
          <BarChart data={timelineData} margin={{ left: 10, right: 10, top: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={65} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[6, 6, 0, 0]} barSize={60} />
          </BarChart>
        ) : (
          <AreaChart data={timelineData} margin={{ left: 10, right: 10, top: 5 }}>
            <defs>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={formatCurrency} axisLine={false} tickLine={false} width={65} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" fill="url(#expenseGrad)" strokeWidth={2.5} dot={{ r: 4, fill: "#f87171", stroke: "white", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#f87171", stroke: "white", strokeWidth: 2 }} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Default export (backward compat) ─── */
interface ChartsProps {
  categoryBreakdown: CategoryBreakdown[];
  monthlyData: MonthlyData[];
  onCategoryClick?: (category: string) => void;
}

export default function Charts({ categoryBreakdown, monthlyData, onCategoryClick }: ChartsProps) {
  return (
    <div className="space-y-6">
      <ExpenseBreakdownChart categoryBreakdown={categoryBreakdown} onCategoryClick={onCategoryClick} />
      <SpendingTrendChart monthlyData={monthlyData} />
    </div>
  );
}
