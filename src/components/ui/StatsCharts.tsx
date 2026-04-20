"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface EnrollmentByMonth {
  month: string;
  count: number;
}

interface ProgressBucket {
  label: string;
  count: number;
  color: string;
}

interface Props {
  enrollmentsByMonth: EnrollmentByMonth[];
  progressBuckets: ProgressBucket[];
}

export function StatsCharts({ enrollmentsByMonth, progressBuckets }: Props) {
  const total = progressBuckets.reduce((s, b) => s + b.count, 0);
  const pieData = progressBuckets.filter(b => b.count > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Area chart — enrollments over time */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#050F1F] mb-1">Inscripciones por mes</h2>
        <p className="text-xs text-[#050F1F]/40 mb-4">Últimos 6 meses</p>
        {enrollmentsByMonth.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[#050F1F]/30 text-sm">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={enrollmentsByMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #F1F5F9", fontSize: 12 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Inscripciones"
                stroke="#1A56DB"
                strokeWidth={2}
                fill="url(#enrollGrad)"
                dot={{ fill: "#1A56DB", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart — progress distribution */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[#050F1F] mb-1">Distribución de progreso</h2>
        <p className="text-xs text-[#050F1F]/40 mb-4">{total} inscripciones en total</p>
        {total === 0 ? (
          <div className="h-40 flex items-center justify-center text-[#050F1F]/30 text-sm">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #F1F5F9", fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value} (${Math.round(value / total * 100)}%)`, name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
