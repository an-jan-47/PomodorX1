import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useApp } from '@/hooks/useApp';
import { motion } from 'framer-motion';

const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--accent))', 
  'hsl(var(--warning))', 
  'hsl(var(--destructive))'
];

// Add missing useMemo import
import { useMemo } from 'react';

// Add proper typing for the label renderer
interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  name: string;
}

const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: CustomizedLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white"
      textAnchor="middle" 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SessionDistributionChart = () => {
  const { pomodoroSessions } = useApp();

  const distributionData = useMemo(() => {
    const focusSessions = pomodoroSessions.filter(s => s.type === "focus");
    const shortSessions = focusSessions.filter(s => s.duration < 25 * 60).length;
    const mediumSessions = focusSessions.filter(s => s.duration >= 25 * 60 && s.duration < 50 * 60).length;
    const longSessions = focusSessions.filter(s => s.duration >= 50 * 60).length;
    const breakSessions = pomodoroSessions.filter(s => s.type === "shortBreak" || s.type === "longBreak").length;

    return [
      { name: 'Deep Work (>50m)', value: longSessions },
      { name: 'Focus (25-50m)', value: mediumSessions },
      { name: 'Short Focus (<25m)', value: shortSessions },
      { name: 'Break Time', value: breakSessions }
    ].filter(item => item.value > 0);
  }, [pomodoroSessions]);

  if (distributionData.length === 0) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Session Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No session data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Session Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value, name) => [
                  `${value} sessions`,
                  name
                ]}
              />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// At the bottom of the file
export default SessionDistributionChart;
