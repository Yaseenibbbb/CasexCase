"use client"

import { X, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Exhibit, ExhibitKind } from "@/lib/parseExhibits";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Pie,
} from 'recharts';

// Define expected data structures for each exhibit type
interface ImageData {
  url: string;
  alt?: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface ChartData {
  type: 'line' | 'bar' | 'pie';
  data: any[]; // Array of data points for the chart
  xAxisKey?: string; // Key for x-axis data (for line/bar)
  yAxisKeys?: string[]; // Keys for y-axis data (for line/bar)
  nameKey?: string; // Key for name in pie chart data
  dataKey?: string; // Key for value in pie chart data
}

interface ExhibitPanelProps {
  items: Exhibit[]
  onClose: () => void
  onPin: () => void
  isPinned: boolean
}

export function ExhibitPanel({
  items,
  onClose,
  onPin,
  isPinned,
}: ExhibitPanelProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-lg border-l border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-medium text-slate-800 dark:text-white">Exhibits</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPin} aria-label={isPinned ? "Unpin panel" : "Pin panel"}>
            <Pin
              className={`h-4 w-4 ${isPinned ? "text-purple-500 dark:text-purple-400" : "text-slate-500 dark:text-slate-400"}`}
              aria-hidden="true"
            />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close panel">
            <X className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
            No exhibits to display.
          </div>
        ) : (
          items.map((exhibit, index) => (
            <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-850">
              <h4 className="font-semibold mb-3 text-slate-800 dark:text-white">{exhibit.title || `Exhibit ${index + 1}`}</h4>
              <div className="overflow-hidden">
                {exhibit.type === "image" && exhibit.data && (
                  <div>
                    <img src={(exhibit.data as ImageData).url || "/placeholder.svg"} alt={(exhibit.data as ImageData).alt || exhibit.title} className="max-w-full h-auto rounded" />
                  </div>
                )}

                {exhibit.type === "table" && exhibit.data && (exhibit.data as TableData).headers && (exhibit.data as TableData).rows && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                          {(exhibit.data as TableData).headers.map((header: string, i: number) => (
                            <th
                              key={i}
                              className="border border-slate-300 dark:border-slate-600 p-2 text-left font-medium text-slate-700 dark:text-slate-300"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(exhibit.data as TableData).rows.map((row: string[], i: number) => (
                          <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-700/50">
                            {row.map((cell, j) => (
                              <td key={j} className="border border-slate-200 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-300">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {exhibit.type === "chart" && exhibit.data && (exhibit.data as ChartData).type && (exhibit.data as ChartData).data && (
                   <div className="w-full h-72" aria-label={`Chart: ${exhibit.title}`}>
                     <ResponsiveContainer width="100%" height="100%">
                       {(exhibit.data as ChartData).type === 'line' && (exhibit.data as ChartData).xAxisKey && (exhibit.data as ChartData).yAxisKeys && (
                         <LineChart data={(exhibit.data as ChartData).data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                           <XAxis dataKey={(exhibit.data as ChartData).xAxisKey} stroke="#9ca3af" fontSize={12} />
                           <YAxis stroke="#9ca3af" fontSize={12} />
                           <Tooltip
                              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px' }}
                              itemStyle={{ color: '#e5e7eb' }}
                           />
                           <Legend wrapperStyle={{ fontSize: '12px' }}/>
                           {(exhibit.data as ChartData).yAxisKeys!.map((key, i) => (
                             <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                           ))}
                         </LineChart>
                       )}
                       {(exhibit.data as ChartData).type === 'bar' && (exhibit.data as ChartData).xAxisKey && (exhibit.data as ChartData).yAxisKeys && (
                          <BarChart data={(exhibit.data as ChartData).data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                            <XAxis dataKey={(exhibit.data as ChartData).xAxisKey} stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                               contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px' }}
                               itemStyle={{ color: '#e5e7eb' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }}/>
                            {(exhibit.data as ChartData).yAxisKeys!.map((key, i) => (
                              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </BarChart>
                        )}
                        {(exhibit.data as ChartData).type === 'pie' && (exhibit.data as ChartData).data && (exhibit.data as ChartData).nameKey && (exhibit.data as ChartData).dataKey && (
                          <PieChart>
                             <Pie
                               data={(exhibit.data as ChartData).data}
                               cx="50%"
                               cy="50%"
                               labelLine={false}
                               outerRadius={80}
                               fill="#8884d8"
                               dataKey={(exhibit.data as ChartData).dataKey}
                               nameKey={(exhibit.data as ChartData).nameKey}
                               label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                  const RADIAN = Math.PI / 180;
                                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                  return (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                      {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                  );
                                }}
                             >
                               {(exhibit.data as ChartData).data.map((entry: any, index: number) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                             </Pie>
                            <Tooltip
                               contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px' }}
                               itemStyle={{ color: '#e5e7eb' }}
                            />
                             <Legend wrapperStyle={{ fontSize: '12px' }}/>
                           </PieChart>
                         )}
                         {(!['line', 'bar', 'pie'].includes((exhibit.data as ChartData).type || '') ||
                           !(exhibit.data as ChartData).data ||
                           ((exhibit.data as ChartData).type !== 'pie' && (!(exhibit.data as ChartData).xAxisKey || !(exhibit.data as ChartData).yAxisKeys)) ||
                           ((exhibit.data as ChartData).type === 'pie' && (!(exhibit.data as ChartData).nameKey || !(exhibit.data as ChartData).dataKey)))
                         && (
                           <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                              Chart type '{(exhibit.data as ChartData).type}' not supported or data is missing.
                           </div>
                         )}
                     </ResponsiveContainer>
                   </div>
                )}

                {!['image', 'table', 'chart'].includes(exhibit.type) || !exhibit.data && (
                  <div className="text-slate-500 dark:text-slate-400">
                    Cannot display exhibit: Unknown type '{exhibit.type}' or missing data.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
