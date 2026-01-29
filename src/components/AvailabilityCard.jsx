import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";

function getColor(percent) {
  if (percent < 40) return "#dc2626"; // red
  if (percent < 70) return "#f59e0b"; // amber
  return "#2563eb"; // blue
}

export default function AvailabilityCard({
  daysWithData,
  totalDays,
}) {
  const percent =
    totalDays > 0 ? (daysWithData / totalDays) * 100 : 0;

  const updated = daysWithData;
  const notUpdated = Math.max(totalDays - daysWithData, 0);
  const color = getColor(percent);

  const data = [
    { name: "Updated", value: percent, fill: color },
  ];

  return (
    <div className="bg-white p-4 shadow-sm">

      {/* ===== GAUGE ===== */}
      <div className="relative h-[160px]">
        <ResponsiveContainer width="100%" height="140%">
          <RadialBarChart
            cx="50%"
            cy="47%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={data}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
            />

            <RadialBar
              dataKey="value"
              cornerRadius={12}
              background={{ fill: "#e5e7eb" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* CENTER LABEL */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-bold text-slate-1000">
            {percent.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">
            Data
          </div>
        </div>
      </div>

        {/* ===== BREAKDOWN ===== */}
        <div className="-mt-4 grid grid-cols-2 gap-6 text-center">
          {/* UPDATED */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-xl font-bold text-slate-800">
              {updated}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Updated
            </div>
          </div>

          {/* NOT UPDATED */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-xl font-bold text-slate-800">
              {notUpdated}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Not Updated
            </div>
          </div>
        </div>


      {/* ===== FOOTNOTE ===== */}
      <div className="mt-5 text-[11px] text-slate-400 leading-snug text-center">
        Status diperoleh berdasarkan data yang masuk sejak hari pertama
        pencatatan.
      </div>
    </div>
  );
}
