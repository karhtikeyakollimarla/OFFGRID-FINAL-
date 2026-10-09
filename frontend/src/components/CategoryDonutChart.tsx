import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

interface CategoryDonutChartProps {
  data: Record<string, number>;
  total: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Roads: '#0284C7', // Sky
  Sanitation: '#10B981', // Emerald
  'Water Supply': '#06B6D4', // Cyan
  Drainage: '#3B82F6', // Blue
  'Streetlights & Electrical': '#F59E0B', // Amber
  Other: '#64748B', // Slate
};

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ data, total }) => {
  const chartData = Object.entries(data).map(([name, count]) => ({
    name,
    value: count,
    color: CATEGORY_COLORS[name] || '#64748B',
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-slate-400">
        No category breakdown available
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Donut with centered count */}
      <div className="relative w-44 h-44 shrink-0 mx-auto sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B1F3A',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fff',
              }}
              formatter={(val: any) => [val, 'Complaints']}
            />
            <Pie
              data={chartData}
              innerRadius={52}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-[#0B1F3A] leading-none">{total}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
            Complaints
          </span>
        </div>
      </div>

      {/* Category Legend Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs flex-1">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate font-medium">{item.name}</span>
            </div>
            <span className="font-mono font-bold text-slate-800 shrink-0">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
