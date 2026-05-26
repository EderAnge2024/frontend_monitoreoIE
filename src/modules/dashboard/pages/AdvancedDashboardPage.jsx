import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  Users, Award, AlertTriangle, TrendingUp, Filter, FileText, Target, BookOpen
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const KPICard = ({ title, value, icon, color }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
    <div style={{ width: '52px', height: '52px', borderRadius: '1rem', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', margin: 0 }}>{title}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
    </div>
  </div>
);

const NivelBadge = ({ nombre, color }) => (
  <span style={{
    display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '2rem',
    fontSize: '0.68rem', fontWeight: '700',
    backgroundColor: color ? `${color}22` : '#eff6ff',
    color: color || 'var(--primary)',
    border: `1px solid ${color ? color + '44' : 'var(--primary)44'}`,
    whiteSpace: 'nowrap'
  }}>{nombre || 'Sin nivel'}</span>
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
            <td style={{ padding: '0.7rem 0.9rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{i + 1}</td>
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

// Tab component
const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '0' }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)} style={{
        padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: '700', border: 'none', cursor: 'pointer',
        borderBottom: active === t.key ? '2px solid var(--primary)' : '2px solid transparent',
        marginBottom: '-2px', borderRadius: '0.4rem 0.4rem 0 0',
        backgroundColor: active === t.key ? 'var(--primary-light)' : 'transparent',
        color: active === t.key ? 'var(--primary)' : 'var(--text-muted)',
        transition: 'all 0.15s'
      }}>{t.label}</button>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdvancedDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ id_institucion: '', id_periodo: '', id_docente: '' });
  const [filterData, setFilterData] = useState({ instituciones: [], periodos: [], docentes: [] });

  // Tab states
  const [tabDocentes, setTabDocentes] = useState('general');
  const [tabTutores, setTabTutores]   = useState('general');

  const fetchFilters = async () => {
    try {
      const [inst, per, doc] = await Promise.all([
        api.get('/instituciones'), api.get('/periodos'), api.get('/docentes')
      ]);
      setFilterData({ instituciones: inst.data, periodos: per.data, docentes: doc.data });
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await api.get(`/monitoreos/stats?${query}`);
      setStats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFilters(); }, []);
  useEffect(() => { fetchStats(); }, [filters]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const docentesTabs = [
    { key: 'general',    label: '📋 General' },
    { key: 'primaria',   label: '🏫 Primaria' },
    { key: 'secundaria', label: '🎓 Secundaria' },
  ];
  const tutoresTabs = [
    { key: 'general',    label: '📋 General' },
    { key: 'primaria',   label: '🏫 Primaria' },
    { key: 'secundaria', label: '🎓 Secundaria' },
  ];

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

  if (loading && !stats) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando dashboard...</div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>

      {/* Header + Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Dashboard de Monitoreo</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Análisis educativo y seguimiento de desempeño docente</p>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', border: '1px solid var(--border)', alignItems: 'center' }}>
          <Filter size={15} color="var(--primary)" />
          <select className="input" style={{ width: '175px', height: '36px', fontSize: '0.8rem' }}
            value={filters.id_institucion} onChange={e => setFilters({ ...filters, id_institucion: e.target.value })}>
            <option value="">Todas las II.EE.</option>
            {filterData.instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
          </select>
          <select className="input" style={{ width: '150px', height: '36px', fontSize: '0.8rem' }}
            value={filters.id_periodo} onChange={e => setFilters({ ...filters, id_periodo: e.target.value })}>
            <option value="">Todos los periodos</option>
            {filterData.periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
          </select>
          <select className="input" style={{ width: '175px', height: '36px', fontSize: '0.8rem' }}
            value={filters.id_docente} onChange={e => setFilters({ ...filters, id_docente: e.target.value })}>
            <option value="">Todos los docentes</option>
            {filterData.docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
          </select>
          <button className="btn btn-outline" style={{ height: '36px', fontSize: '0.8rem' }}
            onClick={() => setFilters({ id_institucion: '', id_periodo: '', id_docente: '' })}>
            Limpiar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <KPICard title="Promedio General"     value={stats?.kpis?.promedio_general || '0.00'} icon={<TrendingUp size={22} color="#2563eb" />} color="#dbeafe" />
        <KPICard title="Docentes Evaluados"   value={stats?.kpis?.total_docentes || '0'}      icon={<Users size={22} color="#10b981" />}      color="#dcfce7" />
        <KPICard title="Total Monitoreos"     value={stats?.kpis?.total_monitoreos || '0'}    icon={<FileText size={22} color="#8b5cf6" />}   color="#f3e8ff" />
        <KPICard title="Alertas Desempeño"    value={stats?.kpis?.alertas_bajo_desempeno || '0'} icon={<AlertTriangle size={22} color="#ef4444" />} color="#fee2e2" />
      </div>

      {/* Gráficas fila 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={17} color="var(--primary)" /> Evolución del Desempeño
          </h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.evolucion || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickFormatter={v => new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="promedio" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={17} color="var(--primary)" /> Distribución por Nivel
          </h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.distribucionNiveles || []} cx="50%" cy="45%" outerRadius={80} dataKey="cantidad" nameKey="nivel_final" paddingAngle={4}>
                  {(stats?.distribucionNiveles || []).map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '0.75rem' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribución por institución */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={17} color="var(--primary)" /> Promedio por Institución
        </h3>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.porInstitucion || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={110} />
              <Tooltip contentStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="promedio" radius={[0, 4, 4, 0]} barSize={16}>
                {(stats?.porInstitucion || []).map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rankings con tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Ranking Docentes */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>🏆 Ranking Docentes</h3>
          </div>
          <div style={{ padding: '0 1.5rem', paddingTop: '1rem' }}>
            <Tabs tabs={docentesTabs} active={tabDocentes} onChange={setTabDocentes} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <RankingTable data={docentesData[tabDocentes]} emptyMsg="Sin docentes en este nivel" />
          </div>
        </div>

        {/* Ranking Tutores */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>🌟 Ranking Tutores</h3>
          </div>
          <div style={{ padding: '0 1.5rem', paddingTop: '1rem' }}>
            <Tabs tabs={tutoresTabs} active={tabTutores} onChange={setTabTutores} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <RankingTable data={tutoresData[tabTutores]} emptyMsg="Sin tutores en este nivel" />
          </div>
        </div>
      </div>

      {/* Historial docente seleccionado */}
      {filters.id_docente && stats?.historialDocente?.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={17} color="var(--primary)" /> Historial del Docente
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {stats.historialDocente.map((h, i) => (
              <div key={i} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.75rem', borderLeft: `4px solid ${h.nivel_color || 'var(--primary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>Visita #{h.numero_visita}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.fecha).toLocaleDateString('es-PE')}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: h.nivel_color || 'var(--primary)', marginBottom: '0.4rem' }}>{h.puntaje_total} pts</div>
                <NivelBadge nombre={h.nivel_final} color={h.nivel_color} />
                {h.observaciones_generales && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                    {h.observaciones_generales.substring(0, 80)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDashboardPage;
