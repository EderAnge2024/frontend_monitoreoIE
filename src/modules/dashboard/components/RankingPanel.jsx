import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { List, BarChart2 } from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const NivelBadge = ({ nombre, color }) => (
  <span style={{
    display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: '2rem',
    fontSize: '0.67rem', fontWeight: '700',
    backgroundColor: color ? `${color}22` : '#eff6ff',
    color: color || 'var(--primary)',
    border: `1px solid ${color ? color + '44' : 'var(--primary)44'}`,
    whiteSpace: 'nowrap'
  }}>{nombre || 'Sin nivel'}</span>
);

// Custom tooltip for bar chart
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.6rem', padding: '0.75rem 1rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px'
    }}>
      <p style={{ margin: '0 0 0.4rem', fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-main)' }}>
        {d.nombre_docente}
      </p>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.institucion}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: '900', color: d.nivel_color || 'var(--primary)' }}>
          {d.promedio}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>pts promedio</span>
      </div>
      <div style={{ marginTop: '0.35rem' }}>
        <NivelBadge nombre={d.nivel_final} color={d.nivel_color} />
      </div>
      <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        {d.visitas_realizadas} visita{d.visitas_realizadas !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

// Bar chart view
const RankingBarChart = ({ data }) => {
  if (!data?.length) return (
    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Sin datos para mostrar
    </div>
  );

  const chartData = data.map((d, i) => ({
    ...d,
    shortName: d.nombre_docente.split(' ').slice(0, 2).join(' '),
    fill: d.nivel_color || COLORS[i % COLORS.length],
  }));

  const maxVal = Math.max(...chartData.map(d => parseFloat(d.promedio) || 0));
  const domain = [0, Math.ceil(maxVal * 1.15)];

  return (
    <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
      <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 44)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            domain={domain}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          />
          <YAxis
            dataKey="shortName"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--text-main)', fontWeight: 600 }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]} barSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="promedio"
              position="right"
              style={{ fontSize: '0.78rem', fontWeight: '800', fill: 'var(--text-main)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend: niveles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        {[...new Map(chartData.map(d => [d.nivel_final, d])).values()].map((d, i) => (
          <NivelBadge key={i} nombre={d.nivel_final} color={d.nivel_color} />
        ))}
      </div>
    </div>
  );
};

// Table view
const RankingTable = ({ data, emptyMsg = 'Sin datos' }) => (
  data?.length > 0 ? (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ backgroundColor: 'var(--background)' }}>
          {['#', 'Docente', 'I.E.', 'Visitas', 'Prom.', 'Nivel'].map((h, i) => (
            <th key={i} style={{
              padding: '0.7rem 0.9rem', fontSize: '0.68rem', color: 'var(--text-muted)',
              fontWeight: '700', textAlign: i >= 3 ? 'center' : 'left', whiteSpace: 'nowrap'
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '0.7rem 0.9rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </td>
            <td style={{ padding: '0.7rem 0.9rem', fontSize: '0.82rem', fontWeight: '600' }}>{d.nombre_docente}</td>
            <td style={{ padding: '0.7rem 0.9rem', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.institucion}</td>
            <td style={{ padding: '0.7rem 0.9rem', fontSize: '0.8rem', textAlign: 'center' }}>{d.visitas_realizadas}</td>
            <td style={{ padding: '0.7rem 0.9rem', fontWeight: '800', color: d.nivel_color || 'var(--primary)', fontSize: '0.9rem', textAlign: 'center' }}>{d.promedio}</td>
            <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center' }}><NivelBadge nombre={d.nivel_final} color={d.nivel_color} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{emptyMsg}</div>
  )
);

const NIVEL_TABS = [
  { key: 'general',    label: 'General' },
  { key: 'primaria',   label: 'Primaria' },
  { key: 'secundaria', label: 'Secundaria' },
];

/**
 * RankingPanel — reutilizable en Dashboard y Reportes
 * Props:
 *   title        string
 *   icon         ReactNode
 *   accentColor  string (css color)
 *   dataMap      { general, primaria, secundaria }  — arrays de docentes
 *   fichas       array  — lista de fichas para filtro
 *   badge        ReactNode (opcional, ej. NivelBadge activo)
 */
const RankingPanel = ({ title, icon, accentColor = 'var(--primary)', dataMap, badge }) => {
  const [view, setView] = useState('list');
  const [tab, setTab]   = useState('general');

  const currentData = dataMap[tab];

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'
      }}>
        <span style={{ color: accentColor }}>{icon}</span>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, flex: 1 }}>{title}</h3>
        {badge}

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '0.4rem', overflow: 'hidden' }}>
          <button
            onClick={() => setView('list')}
            title="Vista lista"
            style={{
              padding: '0.3rem 0.6rem', border: 'none', cursor: 'pointer',
              backgroundColor: view === 'list' ? accentColor : 'transparent',
              color: view === 'list' ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s'
            }}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setView('chart')}
            title="Vista gráfico"
            style={{
              padding: '0.3rem 0.6rem', border: 'none', cursor: 'pointer',
              backgroundColor: view === 'chart' ? accentColor : 'transparent',
              color: view === 'chart' ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s'
            }}
          >
            <BarChart2 size={14} />
          </button>
        </div>
      </div>

      {/* Nivel tabs */}
      <div style={{ padding: '0.6rem 1.5rem 0', display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)' }}>
        {NIVEL_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.5rem 0.9rem', fontSize: '0.77rem', fontWeight: '700', border: 'none', cursor: 'pointer',
            borderBottom: tab === t.key ? `2px solid ${accentColor}` : '2px solid transparent',
            marginBottom: '-2px', borderRadius: '0.4rem 0.4rem 0 0',
            backgroundColor: tab === t.key ? `${accentColor}15` : 'transparent',
            color: tab === t.key ? accentColor : 'var(--text-muted)',
            transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ overflowX: view === 'list' ? 'auto' : 'hidden' }}>
        {view === 'list'
          ? <RankingTable data={currentData} emptyMsg="Sin datos con estos filtros" />
          : <RankingBarChart data={currentData} />
        }
      </div>
    </div>
  );
};

export default RankingPanel;
