"use client";

import { getRiskColor } from "@/lib/risk-engine";

interface Props {
  score: number;
  level: string;
  size?: number;
}

export default function RiskGauge({ score, level, size = 180 }: Props) {
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;
  const color = getRiskColor(level);

  // Needle angle: -90deg = 0, +90deg = 100
  const needleAngle = -90 + (score / 100) * 180;

  const cx = size / 2;
  const cy = size / 2 + 10;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size / 2 + 30}
        viewBox={`0 0 ${size} ${size / 2 + 30}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          className="text-border"
        />
        {/* Gradient segments (risk zones) */}
        {[
          { color: "#16a34a", start: 0, end: 15 },
          { color: "#2563eb", start: 15, end: 35 },
          { color: "#d97706", start: 35, end: 55 },
          { color: "#ea580c", start: 55, end: 75 },
          { color: "#dc2626", start: 75, end: 100 },
        ].map(({ color: c, start, end }, i) => {
          const startAngle = -Math.PI + (start / 100) * Math.PI;
          const endAngle = -Math.PI + (end / 100) * Math.PI;
          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);
          const large = (end - start) > 50 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M ${x1},${y1} A ${radius},${radius} 0 ${large},1 ${x2},${y2}`}
              fill="none"
              stroke={c}
              strokeWidth="14"
              strokeLinecap={i === 0 ? "round" : i === 4 ? "round" : "butt"}
              opacity="0.85"
            />
          );
        })}

        {/* Needle */}
        <g transform={`rotate(${needleAngle}, ${cx}, ${cy})`}>
          <line
            x1={cx}
            y1={cy}
            x2={cx + radius - 12}
            y2={cy}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle cx={cx} cy={cy} r="6" fill={color} />
        <circle cx={cx} cy={cy} r="3" fill="white" />

        {/* Score text */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill={color}
          fontFamily="Inter, sans-serif"
        >
          {score.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="11"
          fill="#6b7280"
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>

        {/* Labels */}
        <text x={cx - radius + 2} y={cy + 20} fontSize="9" fill="#6b7280" fontFamily="Inter">0</text>
        <text x={cx + radius - 8} y={cy + 20} fontSize="9" fill="#6b7280" fontFamily="Inter">100</text>
      </svg>
      <div
        className="px-4 py-1.5 rounded-full text-sm font-bold text-white tracking-wide"
        style={{ backgroundColor: color }}
      >
        {level} RISK
      </div>
    </div>
  );
}
