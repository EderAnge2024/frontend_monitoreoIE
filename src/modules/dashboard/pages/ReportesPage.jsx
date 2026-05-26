import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, ClipboardCheck, Users, AlertTriangle, Target, Award } from 'lucide-react';

const NivelBadge = ({ nombre, color }) => (
  <span style={{
    display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '2rem',
    fontSize: '0.7rem', fontWeight: '700',
    backgroundColor: color ? `${color}22` : 'var(--primary-light)',
    color: color || 'var(--primary)',
    border: `1px solid ${color ? color + '44' : 'var(--primary)44'}`,
    whiteSpace: 'nowrap'
  }}>{nombre || 'Sin nivel'}</span>
);

const StatCard = ({ title, value, icon, accent }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
    <div style={{ padding: '0.75rem', backgroundColor: `${accent}18`, borderRadius: '0.75rem', color: accent, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>{title}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{value ?? '—'}</div>
    </div>
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)' }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)} style={{
        padding: '0.55rem 1rem', fontSize: '0.78rem', fontWeight: '700', border: 'none', cursor: 'pointer',
        borderBottom: active === t.key ? '2px solid var(--primary)' : '2px solid transparent',
        marginBottom: '-2px', borderRadius: '0.4rem 0.4rem 0 0',
        backgroundColor: active === t.key ? 'var(--primary-light)' : 'transparent',
        color: active === t.key ? 'var(--primary)' : 'var(--text-muted)',
        transition: 'all 0.15s'
      }}>{t.label}</button>
    ))}
  </div>
);

const RankingTable = ({ data, emptyMsg = 'Sin datos' }) => (
  data?.length > 0 ? (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ backgroundColor: 'var(--background)' }}>
          {['#', 'Docente', 'I.E.', 'Visitas', 'Prom.', 'Nivel'].map((h, i) => (
            <th key={i} style={{ padding: '0.7rem 0.9rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textAlign: i >= 3 ? 'center' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '0.65rem 0.9rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{i + 1}</td>
            <td style={{ padding: '0.65rem 0.9rem', fontSize: '0.82rem', fontWeight: '600' }}>{d.nombre_docente}</td>
            <td style={{ padding: '0.65rem 0.9rem', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.institucion}</td>
            <td style={{ padding: '0.65rem 0.9rem', fontSize: '0.8rem', textAlign: 'center' }}>{d.visitas_realizadas}</td>
            <td style={{ padding: '0.65rem 0.9rem', fontWeight: '800', color: d.nivel_color || 'var(--primary)', fontSize: '0.9rem', textAlign: 'center' }}>{d.promedio}</td>
            <td style={{ padding: '0.65rem 0.9rem', textAlign: 'center' }}><NivelBadge nombre={d.nivel_final} color={d.nivel_color} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{emptyMsg}</div>
  )
);

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const RANKING_TABS = [
  { key: 'general',    label: '📋 General' },
  { key: 'primaria',   label: '🏫 Primaria' },
  { key: 'secundaria', label: '🎓 Secundaria' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
const ReportesPage = () => {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ id_institucion: '', id_periodo: '' });
  const [filterData, setFilterData] = useState({ instituciones: [], periodos: [] });

  const [tabDocentes, setTabDocentes] = useState('general');
  const [tabTutores, setTabTutores]   = useState('general');

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const [statsRes, inst, per] = await Promise.all([
        api.get(`/monitoreos/stats?${query}`),
        api.get('/instituciones'),
        api.get('/periodos'),
      ]);
      setStats(statsRes.data);
      setFilterData({ instituciones: inst.data, periodos: per.data });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters]);

  if (loading && !stats) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Generando reportes...</div>
  );

  const niveles     = stats?.niveles || [];
  const distribucion = stats?.distribucionNiveles || [];

  const docentesData = {
    general:    stats?.rankingDocentes,
    primaria:   stats?.rankingDocentesPrimaria,
    secundaria: stats?.rankingDocentesSecundaria,
  };
  const tutoresData = {
    general:    stats?.rankingTutores,
    primaria:   stats?.rankingTutoresPrimaria,
    secundaria: stats?.rankingTutoresSecundaria,
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Reportes y Estadísticas
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Análisis del desempeño docente a nivel institucional.</p>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', padding: '0.875rem', borderRadius: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', border: '1px solid var(--border)', alignItems: 'center' }}>
          <select className="input" style={{ width: '160px', height: '36px', fontSize: '0.8125rem' }}
            value={filters.id_institucion} onChange={e => setFilters({ ...filters, id_institucion: e.target.value })}>
            <option value="">Todas las II.EE.</option>
            {filterData.instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
          </select>
          <select className="input" style={{ width: '140px', height: '36px', fontSize: '0.8125rem' }}
            value={filters.id_periodo} onChange={e => setFilters({ ...filters, id_periodo: e.target.value })}>
            <option value="">Todos los periodos</option>
            {filterData.periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
          </select>
          <button className="btn btn-outline" style={{ height: '36px', fontSize: '0.8125rem' }}
            onClick={() => setFilters({ id_institucion: '', id_periodo: '' })}>
            Limpiar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard title="Total Monitoreos"   value={stats?.kpis?.total_monitoreos || '0'}    icon={<ClipboardCheck size={22} />} accent="#2563eb" />
        <StatCard title="Promedio General"   value={stats?.kpis?.promedio_general || '0.00'} icon={<TrendingUp size={22} />}    accent="#10b981" />
        <StatCard title="Docentes Evaluados" value={stats?.kpis?.total_docentes || '0'}      icon={<Users size={22} />}         accent="#8b5cf6" />
        <StatCard
          title={`Bajo desempeño${niveles.length > 0 ? ` (≤${niveles[0].puntaje_maximo} pts)` : ''}`}
          value={stats?.kpis?.alertas_bajo_desempeno || '0'}
          icon={<AlertTriangle size={22} />} accent="#ef4444"
        />
      </div>

      {/* Gráficas fila 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />Evolución del Promedio
          </h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.evolucion || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickFormatter={v => new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="promedio" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            <Target size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />Distribución General
          </h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribucion} cx="50%" cy="45%" outerRadius={75} dataKey="cantidad" nameKey="nivel_final" paddingAngle={4}>
                  {distribucion.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', fontSize: '0.75rem' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.68rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            <Award size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />Niveles de Tutoría
          </h3>
          {!stats?.distribucionTutores?.length ? (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin datos</div>
          ) : (
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.distribucionTutores} cx="50%" cy="45%" outerRadius={75} dataKey="cantidad" nameKey="nivel_final" paddingAngle={4}>
                    {stats.distribucionTutores.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', fontSize: '0.75rem' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '0.68rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Rankings con tabs — Docentes y Tutores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Ranking Docentes */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={17} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>🏆 Ranking Docentes</h3>
          </div>
          <div style={{ padding: '0.75rem 1.5rem 0' }}>
            <Tabs tabs={RANKING_TABS} active={tabDocentes} onChange={setTabDocentes} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <RankingTable data={docentesData[tabDocentes]} emptyMsg="Sin docentes en este nivel educativo" />
          </div>
        </div>

        {/* Ranking Tutores */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={17} color="#8b5cf6" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>🌟 Ranking Tutores</h3>
          </div>
          <div style={{ padding: '0.75rem 1.5rem 0' }}>
            <Tabs tabs={RANKING_TABS} active={tabTutores} onChange={setTabTutores} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <RankingTable data={tutoresData[tabTutores]} emptyMsg="Sin tutores en este nivel educativo" />
          </div>
        </div>
      </div>

      {/* Ranking Acumulado */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--primary-light)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--primary)' }}>📊 Ranking por Puntaje Acumulado</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--background)' }}>
                {['Pos', 'Docente / Tutor', 'I.E.', 'Visitas', 'Puntaje Total'].map((h, i) => (
                  <th key={i} style={{ padding: '0.7rem 1rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats?.rankingAcumulado?.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>#{i + 1}</td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', fontWeight: '600' }}>{d.nombre_docente}</td>
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.institucion}</td>
                  <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.85rem' }}>{d.visitas}</td>
                  <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: '800', color: 'var(--primary)', fontSize: '1rem' }}>{d.puntaje_total} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Por institución */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Promedio por Institución</h3>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.porInstitucion || []} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={110} />
              <Tooltip contentStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="promedio" fill="var(--primary)" barSize={14} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metodología */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--primary-light)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '50%', color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem' }}>Información Metodológica</h3>
            <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
              <li><strong>Promedio General:</strong> Media aritmética de los puntajes de todos los monitoreos completados.</li>
              <li><strong>Niveles de Desempeño:</strong> Clasificación dinámica basada en los rangos configurados en el módulo de Niveles.</li>
              <li><strong>Ranking Docentes/Tutores:</strong> Separados por nivel educativo (Primaria / Secundaria) según el campo nivel del docente.</li>
              <li><strong>Alertas:</strong> Conteo de evaluaciones cuyo puntaje cae en el primer nivel configurado (nivel base).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;
