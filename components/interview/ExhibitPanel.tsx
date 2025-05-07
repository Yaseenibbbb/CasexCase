"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Pin, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Button, Card, CardHeader, CardBody, CardFooter, Divider, Image as NextUIImage, Tooltip } from "@heroui/react"
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
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import type { Exhibit } from "@/lib/parseExhibits"

interface ExhibitPanelProps {
  exhibits: Exhibit[]
  currentIndex: number
  onClose: () => void
  onPin: () => void
  isPinned: boolean
  onNext: () => void
  onPrev: () => void
}

// Define some colors for charts
const COLORS = ["#8b5cf6", "#6366f1", "#ec4899", "#f59e0b", "#10b981"]

export function ExhibitPanel({
  exhibits,
  currentIndex,
  onClose,
  onPin,
  isPinned,
  onNext,
  onPrev,
}: ExhibitPanelProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  
  const exhibit = exhibits && exhibits.length > currentIndex ? exhibits[currentIndex] : null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));

  // Simplify data formatting for charts - assumes exhibit.data is like [{label:"X", value: Y}]
  let formattedChartData: { name: string; value: number }[] | null = null;
  if (exhibit && ('pie' === exhibit.type || 'bar' === exhibit.type || 'line' === exhibit.type) && Array.isArray(exhibit.data)) {
      formattedChartData = exhibit.data
         .filter(item => typeof item === 'object' && item !== null && item.hasOwnProperty('label') && item.hasOwnProperty('value'))
         .map((item: any) => ({
             name: item.label,
             value: Number(item.value) || 0, 
         }));
  }

  // --- Table Data Formatting ---
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  if (exhibit && exhibit.type === 'table' && typeof exhibit.data === 'object' && exhibit.data !== null && 'headers' in exhibit.data && 'rows' in exhibit.data && Array.isArray(exhibit.data.headers) && Array.isArray(exhibit.data.rows)) {
     tableHeaders = exhibit.data.headers as string[];
     tableRows = exhibit.data.rows as string[][];
  }

  // --- Image URL Check ---
  const imageUrl = (exhibit && exhibit.type === 'image' && typeof exhibit.data === 'string') ? exhibit.data : null;

  if (!exhibit) {
    return (
      <Card className="flex flex-col h-full p-4 items-center justify-center">
        <p className="text-foreground-500">
          {exhibits && exhibits.length > 0 ? "Invalid exhibit index." : "No exhibits available yet."}
        </p>
        <Button variant="flat" size="sm" onClick={onClose} className="mt-4">Close Panel</Button>
      </Card>
    );
  }

  return (
    <Card 
      className="flex flex-col h-full w-full rounded-none lg:rounded-l-lg border-l border-divider shadow-lg"
      radius="none"
    >
      <CardHeader className="flex items-center justify-between p-3 border-b border-divider">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-semibold p-1 rounded-md aspect-square flex items-center justify-center">
            {currentIndex + 1}
          </span>
          {exhibit?.title || "Exhibit"}
        </h3>
        <div className="flex gap-1">
          <Tooltip content={isPinned ? "Unpin Panel" : "Pin Panel"} placement="bottom">
             <Button isIconOnly variant="light" size="sm" aria-label="Pin panel" onClick={onPin}>
               <Pin size={16} className={isPinned ? "text-primary" : "text-foreground-500"} />
             </Button>
          </Tooltip>
          <Tooltip content="Close Panel" placement="bottom">
             <Button isIconOnly variant="light" size="sm" aria-label="Close panel" onClick={onClose}>
               <X size={16} className="text-foreground-500" />
             </Button>
          </Tooltip>
        </div>
      </CardHeader>

      <CardBody className="p-4 overflow-auto flex-1">
        {exhibit.type === "image" && imageUrl && (
          <div
            className="flex items-center justify-center bg-content1 rounded-lg p-2"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center", transition: "transform 0.2s" }}
          >
            <NextUIImage
              src={imageUrl}
              alt={exhibit.title}
              radius="md"
              shadow="sm"
              className="max-w-full h-auto object-contain"
            />
          </div>
        )}

        {exhibit.type === "table" && tableHeaders.length > 0 && (
          <div className="overflow-x-auto bg-content1 rounded-lg shadow-sm border border-divider">
            <table className="w-full border-collapse">
              <thead className="bg-content2">
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th key={i} className="border-b border-divider p-3 text-sm text-left font-medium text-foreground-600">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-divider last:border-b-0 hover:bg-content2 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="p-3 text-sm text-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(exhibit.type === 'pie' || exhibit.type === 'bar' || exhibit.type === 'line') && formattedChartData && (
          <div className="h-[300px] w-full flex items-center justify-center bg-content1 rounded-lg p-2 shadow-sm border border-divider">
            <ResponsiveContainer width="100%" height="100%">
              <>
                {exhibit.type === 'pie' && (
                  <PieChart>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--nextui-background)', borderRadius: 'var(--nextui-radius-medium)', border: '1px solid var(--nextui-colors-divider)', color: 'var(--nextui-foreground)' }} wrapperClassName="text-xs"/>
                    <Legend wrapperStyle={{ fontSize: '0.75rem'}} />
                    <Pie data={formattedChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}>
                      {formattedChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                )}
                {exhibit.type === 'bar' && (
                  <BarChart data={formattedChartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--nextui-colors-divider)" />
                     <XAxis dataKey="name" stroke="var(--nextui-colors-foreground-500)" fontSize={10} />
                     <YAxis stroke="var(--nextui-colors-foreground-500)" fontSize={10}/>
                     <RechartsTooltip contentStyle={{ backgroundColor: 'var(--nextui-background)', borderRadius: 'var(--nextui-radius-medium)', border: '1px solid var(--nextui-colors-divider)', color: 'var(--nextui-foreground)' }} wrapperClassName="text-xs"/>
                     <Legend wrapperStyle={{ fontSize: '0.75rem'}} />
                     <Bar dataKey="value" name="Value">
                        {formattedChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Bar>
                  </BarChart>
                )}
                {exhibit.type === 'line' && (
                   <LineChart data={formattedChartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--nextui-colors-divider)" />
                     <XAxis dataKey="name" stroke="var(--nextui-colors-foreground-500)" fontSize={10} />
                     <YAxis stroke="var(--nextui-colors-foreground-500)" fontSize={10}/>
                     <RechartsTooltip contentStyle={{ backgroundColor: 'var(--nextui-background)', borderRadius: 'var(--nextui-radius-medium)', border: '1px solid var(--nextui-colors-divider)', color: 'var(--nextui-foreground)' }} wrapperClassName="text-xs" />
                     <Legend wrapperStyle={{ fontSize: '0.75rem'}} />
                     <Line type="monotone" dataKey="value" stroke="var(--nextui-colors-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Value" />
                   </LineChart>
                )}
              </>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>

      <CardFooter className="p-3 border-t border-divider flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <Tooltip content="Zoom Out" placement="top">
             <Button isIconOnly variant="flat" size="sm" aria-label="Zoom Out" onClick={handleZoomOut} isDisabled={zoomLevel <= 0.5}>
               <ZoomOut size={16} />
             </Button>
          </Tooltip>
           <Tooltip content="Zoom In" placement="top">
             <Button isIconOnly variant="flat" size="sm" aria-label="Zoom In" onClick={handleZoomIn} isDisabled={zoomLevel >= 2}>
               <ZoomIn size={16} />
             </Button>
           </Tooltip>
        </div>

        <div className="flex gap-1">
           <Tooltip content="Previous Exhibit" placement="top">
              <Button isIconOnly variant="flat" size="sm" aria-label="Previous Exhibit" onClick={onPrev} isDisabled={currentIndex <= 0}>
                 <ChevronLeft size={16} />
              </Button>
           </Tooltip>
           <span className="text-xs text-foreground-500 px-2 flex items-center">
             {currentIndex + 1} / {exhibits.length}
           </span>
           <Tooltip content="Next Exhibit" placement="top">
              <Button isIconOnly variant="flat" size="sm" aria-label="Next Exhibit" onClick={onNext} isDisabled={currentIndex >= exhibits.length - 1}>
                 <ChevronRight size={16} />
              </Button>
           </Tooltip>
        </div>
      </CardFooter>
    </Card>
  )
}
