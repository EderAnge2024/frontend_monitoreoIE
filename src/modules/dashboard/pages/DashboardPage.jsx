import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Award, AlertTriangle, TrendingUp, ClipboardCheck, Target
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getNivelColor = (niveles, nombre) => {
  if (!niveles?.length || !nombre) return '#94a3b8';
  const found = niveles.find(n => n.nombre === nombre);
  return found?.color || '#6366f1';
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ title, value, icon, color, textColor }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'default' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '1rem', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500', margin: 0 }}>{title}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: '800', color: textColor || 'var(--text-main)', letterSpacing: '-0.5px', margin: 0 }}>{value}</p>
    </div>
  </div>
);

// ── Nivel Badge ───────────────────────────────────────────────────────────────
const NivelBadge = ({ nombre, color }) => (
  <span style={{
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '2rem',
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: color ? `${color}22` : 'var(--primary-light)',
    color: color || 'var(--primary)',
    border: `1px solid ${color || 'var(--primary)'}44`,
  }}>
    {nombre || 'Sin nivel'}
  </span>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ id_institucion: '', id_periodo: '', id_docente: '' });
  const [filterData, setFilterData] = useState({ instituciones: [], periodos: [], docentes: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const [statsRes, inst, per, doc] = await Promise.all([
        api.get(`/monitoreos/stats?${query}`),
        api.get('/instituciones'),
        api.get('/periodos'),
        api.get('/docentes')
      ]);
      setStats(statsRes.data);
      setFilterData({ instituciones: inst.data, periodos: per.data, docentes: doc.data });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user.role !== 'docente') fetchData();
    else setLoading(false);
  }, [filters, user]);

  // ── Docente view ────────────────────────────────────────────────────────────
  if (loading && !stats) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      Cargando análisis avanzado...
    </div>
  );

  if (user.role === 'docente') {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Panel del Docente</h1>
          <p style={{ color: 'var(--text-muted)' }}>Hola {user.nombres}, bienvenido a tu portal de monitoreo.</p>
        </div>
        <div className="card" style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '1rem', color: 'var(--primary)' }}>
              <Award size={48} />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>Tus Monitoreos</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Revisa el historial de tus evaluaciones y el progreso de tu desempeño pedagógico.</p>
              <button className="btn btn-primary" onClick={() => window.location.href = '/mis-monitoreos'}>Ver mis evaluaciones</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const niveles = stats?.niveles || [];

  // ── Admin / Especialista view ────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>

      {/* ── Niveles banner (si hay configurados) ── */}
      {niveles.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {niveles.map(n => (
            <div key={n.id_nivel} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.85rem', borderRadius: '2rem',
              backgroundColor: `${n.color || '#6366f1'}22`,
              border: `1px solid ${n.color || '#6366f1'}44`,
              fontSize: '0.75rem', fontWeight: '600',
              color: n.color || '#6366f1'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: n.color || '#6366f1', display: 'inline-block' }} />
              {n.nombre}: {n.puntaje_minimo}–{n.puntaje_maximo} pts
            </div>
          ))}
        </div>
      )}

      {/* ── Header & Filters ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Dashboard de Monitoreo</h1>
          <p style={{ color: 'var(--text-muted)' }}>Análisis educativo y seguimiento de desempeño docente (Nivel UGEL)</p>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', border: '1px solid var(--border)' }}>
          <select className="input" style={{ width: '160px', height: '38px', fontSize: '0.8125rem' }}
            value={filters.id_institucion} onChange={e => setFilters({ ...filters, id_institucion: e.target.value })}>
            <option value="">Todas las II.EE.</option>
            {filterData.instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
          </select>
          <select className="input" style={{ width: '140px', height: '38px', fontSize: '0.8125rem' }}
            value={filters.id_periodo} onChange={e => setFilters({ ...filters, id_periodo: e.target.value })}>
            <option value="">Periodos</option>
            {filterData.periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
          </select>
          <select className="input" style={{ width: '160px', height: '38px', fontSize: '0.8125rem' }}
            value={filters.id_docente} onChange={e => setFilters({ ...filters, id_docente: e.target.value })}>
            <option value="">Docentes</option>
            {filterData.docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
          </select>
          <button className="btn btn-outline" style={{ height: '38px' }}
            onClick={() => setFilters({ id_institucion: '', id_periodo: '', id_docente: '' })}>
            Limpiar
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <KPICard title="Promedio General" value={stats?.kpis?.promedio_general || '—'} icon={<TrendingUp color="#2563eb" size={22} />} color="rgba(37,99,235,0.12)" />
        <KPICard title="Docentes Evaluados" value={stats?.kpis?.total_docentes || '0'} icon={<Users color="#10b981" size={22} />} color="rgba(16,185,129,0.12)" />
        <KPICard title="Total Monitoreos" value={stats?.kpis?.total_monitoreos || '0'} icon={<ClipboardCheck color="#8b5cf6" size={22} />} color="rgba(139,92,246,0.12)" />
        <KPICard
          title={`Bajo Desempeño${niveles.length > 0 ? ` (≤${niveles[0]?.puntaje_maximo} pts)` : ''}`}
          value={stats?.kpis?.alertas_bajo_desempeno || '0'}
          icon={<AlertTriangle color="#ef4444" size={22} />}
          color="rgba(239,68,68,0.12)"
          textColor={Number(stats?.kpis?.alertas_bajo_desempeno) > 0 ? '#ef4444' : undefined}
        />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Evolución temporal */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Evolución del Desempeño</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.evolucion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickFormatter={str => new Date(str).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                {niveles.map(n => (
                  <Line key={`ref-${n.id_nivel}`} type="monotone" dataKey={() => n.puntaje_minimo}
                    stroke={n.color || '#6366f1'} strokeDasharray="4 4" strokeWidth={1} dot={false} legendType="none" />
                ))}
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-main)', fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="promedio" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} name="Promedio" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución General */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Distribución General</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.distribucionNiveles} cx="50%" cy="45%" outerRadius={70} dataKey="cantidad" nameKey="nivel_final" paddingAngle={3}>
                  {stats?.distribucionNiveles?.map((entry, i) => <Cell key={i} fill={entry.color || '#6366f1'} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.65rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución Tutoría */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Niveles de Tutoría</h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {stats?.distribucionTutores?.length > 0 ? (
                <PieChart>
                  <Pie data={stats.distribucionTutores} cx="50%" cy="45%" outerRadius={70} dataKey="cantidad" nameKey="nivel_final" paddingAngle={3}>
                    {stats.distribucionTutores.map((entry, i) => <Cell key={i} fill={entry.color || '#6366f1'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.65rem' }} />
                </PieChart>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin datos de tutoría</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      {/* ── Rankings Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Ranking Docentes */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Ranking Docentes (Pedagógico)</h3>
          </div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '170px' }}>
            {(!stats?.rankingDocentes || stats.rankingDocentes.length === 0) ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin datos.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: 'var(--background)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>DOCENTE</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>PROM.</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>NIVEL</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rankingDocentes.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{i+1}</td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{d.nombre_docente}</div>
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: '700', fontSize: '0.8rem', color: d.nivel_color }}>{d.promedio}</td>
                      <td style={{ padding: '0.6rem 1rem' }}><NivelBadge nombre={d.nivel_final} color={d.nivel_color} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Ranking Tutores */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--success)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Ranking de Tutores</h3>
          </div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '170px' }}>
            {(!stats?.rankingTutores || stats.rankingTutores.length === 0) ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin datos de tutoría.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: 'var(--background)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>TUTOR</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>PROM.</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>NIVEL</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rankingTutores.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{i+1}</td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{d.nombre_docente}</div>
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: '700', fontSize: '0.8rem', color: d.nivel_color }}>{d.promedio}</td>
                      <td style={{ padding: '0.6rem 1rem' }}><NivelBadge nombre={d.nivel_final} color={d.nivel_color} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

        {/* Historial docente / Alertas */}
        {filters.id_docente ? (
          <div className="card" style={{ padding: '1.5rem', overflow: 'auto', maxHeight: '420px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.25rem' }}>Historial del Docente</h3>
            {(!stats?.historialDocente || stats.historialDocente.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin monitoreos registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.historialDocente.map((h, i) => (
                  <div key={i} style={{ padding: '1rem', border: `1px solid ${h.nivel_color || 'var(--border)'}44`, borderLeft: `4px solid ${h.nivel_color || 'var(--primary)'}`, borderRadius: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>Visita #{h.numero_visita}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.fecha).toLocaleDateString('es-PE')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: h.nivel_color || 'var(--primary)' }}>{h.puntaje_total} pts</span>
                      <NivelBadge nombre={h.nivel_final} color={h.nivel_color} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Monitor: {h.monitor}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.25rem' }}>
              <Target size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Alertas por Nivel
            </h3>
            {niveles.length === 0 ? (
              <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                No hay niveles configurados. Ve a <strong>Niveles de Desempeño</strong> para crear rangos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {niveles.map(n => {
                  const dist = stats?.distribucionNiveles?.find(d => d.nivel_final === n.nombre);
                  const cantidad = dist?.cantidad || 0;
                  const isLowest = n.nombre === niveles[0]?.nombre;
                  return (
                    <div key={n.id_nivel} style={{
                      padding: '0.875rem 1rem',
                      backgroundColor: `${n.color || '#6366f1'}11`,
                      border: `1px solid ${n.color || '#6366f1'}33`,
                      borderLeft: `4px solid ${n.color || '#6366f1'}`,
                      borderRadius: '0.75rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontWeight: '700', color: n.color || '#6366f1', fontSize: '0.875rem', margin: 0 }}>{n.nombre}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{n.puntaje_minimo}–{n.puntaje_maximo} pts</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: '900', color: n.color || '#6366f1', margin: 0 }}>{cantidad}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>evaluac.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
  );
};

export default DashboardPage;
