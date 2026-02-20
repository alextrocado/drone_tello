import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useDroneStore } from '../store';

export const TelemetryCharts: React.FC = () => {
  const history = useDroneStore((state) => state.drone.history);
  
  const data = history.map((h, i) => ({
    ...h,
    index: i,
    timeLabel: new Date(h.time).toLocaleTimeString([], { second: '2-digit' })
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full p-4 overflow-y-auto">
      {/* Height Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-64">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Altura (cm)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="index" hide />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b' }}
            />
            <Area type="monotone" dataKey="height" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHeight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Battery Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-64">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Bateria (%)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="index" hide />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Line type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Speed Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-64 md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Velocidade (cm/s)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="index" hide />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area type="monotone" dataKey="speed" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSpeed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
