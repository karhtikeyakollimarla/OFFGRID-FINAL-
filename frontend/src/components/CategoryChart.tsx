import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface CategoryChartProps {
  data: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  Roads: '#0284C7', // Sky
  Sanitation: '#10B981', // Emerald
  'Water Supply': '#06B6D4', // Cyan
  Drainage: '#3B82F6', // Blue
  'Streetlights & Electrical': '#F59E0B', // Amber
  Other: '#64748B', // Slate
};

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([name, count]) => ({
    name,
    count,
    color: CATEGORY_COLORS[name] || '#64748B',
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
        No category data available
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748B' }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748B' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0B1F3A',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
            }}
            itemStyle={{ color: '#14B8A6' }}
            formatter={(val) => [val, 'Complaints']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
