import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell, Label
} from 'recharts';

interface PriceBarChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  ariaLabel?: string;
}

const COLORS = [
  '#f97316', '#1a56db', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#be185d',
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--surface-elevated)] px-3 py-2 rounded-lg border border-[var(--border-primary)] shadow-lg">
      <p className="font-bold text-sm text-[var(--text-primary)]">{label}</p>
      <p className="text-base font-mono font-bold text-[var(--color-on-surface-primary)]">
        S/ {payload[0].value.toFixed(2)}
      </p>
    </div>
  );
};

const PriceBarChart: React.FC<PriceBarChartProps> = ({ data, title, ariaLabel }) => {
  const chartData = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length],
    })), [data]
  );

  const average = useMemo(() => {
    const valid = chartData.filter(d => d.value > 0);
    return valid.length > 0 ? valid.reduce((s, d) => s + d.value, 0) / valid.length : 0;
  }, [chartData]);

  return (
    <div className="w-full" role="img" aria-label={ariaLabel || title || 'Gráfico de barras de precios'}>
      {title && <h3 className="text-base sm:text-lg font-semibold mb-3 text-[var(--text-primary)]">{title}</h3>}

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border-primary)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `S/${v.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke="var(--color-accent-500)"
                strokeDasharray="6 3"
                strokeWidth={2}
              >
                <Label
                  value={`Prom. S/. ${average.toFixed(2)}`}
                  position="top"
                  fontSize={11}
                  fill="var(--text-tertiary)"
                />
              </ReferenceLine>
            )}
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={64}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 0 ? entry.color : 'var(--border-secondary)'}
                  opacity={entry.value > 0 ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="sr-only">
        <table>
          <caption>Precios por competidor</caption>
          <thead><tr><th>Competidor</th><th>Precio (S/)</th></tr></thead>
          <tbody>
            {chartData.map((item, i) => (
              <tr key={i}><td>{item.name}</td><td>{item.value.toFixed(2)}</td></tr>
            ))}
          </tbody>
          {average > 0 && (
            <tfoot><tr><td>Promedio</td><td>{average.toFixed(2)}</td></tr></tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default PriceBarChart;
