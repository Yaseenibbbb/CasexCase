interface ProgressDonutProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ProgressDonut({ value, size = 50, strokeWidth = 5, className = "" }: ProgressDonutProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const dash = (value * circumference) / 100

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />

        {/* Progress circle with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
        />

        {/* Define the gradient */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" /> {/* purple-500 */}
            <stop offset="100%" stopColor="#6366f1" /> {/* indigo-500 */}
          </linearGradient>
        </defs>
      </svg>

      {/* Percentage text in the middle */}
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-800 dark:text-white">
        {value}%
      </div>
    </div>
  )
}
