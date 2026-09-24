import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  subtitle,
  icon,
}: StatCardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : changeType === "negative"
      ? "text-rose-600 bg-rose-50 border-rose-200"
      : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${changeColor}`}
          >
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 leading-normal">{subtitle}</p>
      )}
    </div>
  );
}

export default StatCard;
