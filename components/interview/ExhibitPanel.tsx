"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Pin, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface ExhibitPanelProps {
  exhibits: any[]
  currentExhibit: number
  onClose: () => void
  onPin: () => void
  isPinned: boolean
  onNext: () => void
  onPrev: () => void
}

// Define some colors for charts
const COLORS = ["#8b5cf6", "#6366f1", "#ec4899", "#f59e0b", "#10b981"];

export function ExhibitPanel({
  exhibits,
  currentExhibit,
  onClose,
  onPin,
  isPinned,
  onNext,
  onPrev,
}: ExhibitPanelProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const exhibit = exhibits[currentExhibit]

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }

  const renderChart = () => {
    if (!exhibit || exhibit.type !== 'chart' || !exhibit.data || !exhibit.chartType) {
      return <p className="text-slate-500 dark:text-slate-400">Chart data is missing or invalid.</p>;
    }

    const chartData = exhibit.data.datasets[0]?.data; // Assuming simple structure for now
    const labels = exhibit.data.labels;
    const formattedData = labels.map((label: string, index: number) => ({
      name: label,
      value: chartData[index],
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <>
          {exhibit.chartType === 'line' && (
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" stroke="#64748b" className="dark:stroke-slate-400 text-xs" />
              <YAxis stroke="#64748b" className="dark:stroke-slate-400 text-xs" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} itemStyle={{ color: '#334155' }} wrapperClassName="text-xs dark:!bg-slate-800/80 dark:!border-slate-700 dark:[&_*]:!text-slate-300" />
              <Legend wrapperStyle={{ fontSize: '0.75rem'}} />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name={exhibit.data.datasets[0]?.label || 'Value'} />
            </LineChart>
          )}
          {exhibit.chartType === 'bar' && (
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" stroke="#64748b" className="dark:stroke-slate-400 text-xs" />
              <YAxis stroke="#64748b" className="dark:stroke-slate-400 text-xs" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} itemStyle={{ color: '#334155' }} wrapperClassName="text-xs dark:!bg-slate-800/80 dark:!border-slate-700 dark:[&_*]:!text-slate-300"/>
              <Legend wrapperStyle={{ fontSize: '0.75rem'}} />
              <Bar dataKey="value" name={exhibit.data.datasets[0]?.label || 'Value'} >
                {formattedData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
           {exhibit.chartType === 'pie' && (
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} itemStyle={{ color: '#334155' }} wrapperClassName="text-xs dark:!bg-slate-800/80 dark:!border-slate-700 dark:[&_*]:!text-slate-300"/>
              <Legend wrapperStyle={{ fontSize: '0.75rem'}} />
              <Pie data={formattedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} >
                {formattedData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div
      className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-lg"
      initial={{ x: 350, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 350, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-md">
            {currentExhibit + 1}
          </span>
          {exhibit?.title || "Exhibit"}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onPin}
          >
            <Pin
              className={`h-4 w-4 ${isPinned ? "text-purple-500 dark:text-purple-400" : "text-slate-500 dark:text-slate-400"}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {exhibit?.type === "image" && (
          <div
            className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center", transition: "transform 0.2s" }}
          >
            <img
              src={exhibit.url || "/placeholder.svg"}
              alt={exhibit.title}
              className="max-w-full h-auto rounded-md shadow-sm"
            />
          </div>
        )}

        {exhibit?.type === "table" && (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-lg shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {exhibit.data.headers.map((header: string, i: number) => (
                    <th
                      key={i}
                      className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-3 text-sm text-left font-medium"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exhibit.data.rows.map((row: string[], i: number) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}
                  >
                    {row.map((cell, j) => (
                      <td key={j} className="border border-slate-200 dark:border-slate-700 p-3 text-sm">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {exhibit?.type === "chart" && (
          <div className="h-[350px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 shadow-sm">
            {renderChart()}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Zoom Out</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2}
          >
            <ZoomIn className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Zoom In</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg">
            <Download className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Download</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full"
            onClick={onPrev}
            disabled={currentExhibit === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-slate-700 dark:text-slate-300">
            {currentExhibit + 1} / {exhibits.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full"
            onClick={onNext}
            disabled={currentExhibit === exhibits.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
