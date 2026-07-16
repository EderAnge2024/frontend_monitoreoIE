import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, ClipboardCheck, Users, AlertTriangle, Award, Filter, X, Download } from 'lucide-react';
import RankingPanel from '../components/RankingPanel';

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

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const EMPTY_FILTERS = { id_institucion: '', id_periodo: '', id_ficha: '', id_docente: '', nivel_desempeno: '' };

const ReportesPage = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterData, setFilterData] = useState({ instituciones: [], periodos: [], fichas: [], docentes: [], niveles: [] });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [inst, per, fic, doc, niv] = await Promise.all([
          api.get('/instituciones'), api.get('/periodos'),
          api.get('/fichas'), api.get('/docentes'),
          api.get('/niveles'),
        ]);
        setFilterData({ instituciones: inst.data, periodos: per.data, fichas: fic.data, docentes: doc.data, niveles: niv.data });
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // nivel_desempeno NO se envía al backend, se aplica solo en frontend sobre los rankings
        const { nivel_desempeno, ...backendFilters } = filters;
        const params = Object.fromEntries(Object.entries(backendFilters).filter(([, v]) => v !== ''));
        const res = await api.get(`/monitoreos/stats?${new URLSearchParams(params)}`);
        setStats(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [filters]);

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const clearFilters = () => setFilters(EMPTY_FILTERS);
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const { nivel_desempeno, ...backendFilters } = filters;
      const params = Object.fromEntries(Object.entries(backendFilters).filter(([, v]) => v !== ''));
      const response = await api.get(`/monitoreos/export/excel?${new URLSearchParams(params)}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Monitoreos_${new Date().toISOString().slice(0, 10)}.xlsx`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error al exportar:', err);
      alert('Error al generar el archivo Excel');
    } finally {
      setExporting(false);
    }
  };

  const nivelesDisponibles = useMemo(() => {
    if (filterData.niveles?.length > 0) return filterData.niveles;
    return stats?.niveles || [];
  }, [filterData.niveles, stats]);

  // Filtro de nivel aplicado solo en frontend sobre los rankings
  const applyNivel = (data) => {
    if (!filters.nivel_desempeno || !data) return data;
    return data.filter(d => d.nivel_final === filters.nivel_desempeno);
  };

  const docentesData = {
    general:    applyNivel(stats?.rankingDocentes),
    primaria:   applyNivel(stats?.rankingDocentesPrimaria),
    secundaria: applyNivel(stats?.rankingDocentesSecundaria),
  };
  const tutoresData = {
    general:    applyNivel(stats?.rankingTutores),
    primaria:   applyNivel(stats?.rankingTutoresPrimaria),
    secundaria: applyNivel(stats?.rankingTutoresSecundaria),
  };

  const niveles     = stats?.niveles || [];
  const distribucion = stats?.distribucionNiveles || [];

  if (loading && !stats) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Generando reportes...</div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Reportes y Estadísticas
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Cada filtro actúa de forma independiente — sin filtro activo se muestran todos los datos.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleExportExcel}
          disabled={exporting}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            minWidth: '140px',
            justifyContent: 'center'
          }}
        >
          <Download size={16} />
          {exporting ? 'Generando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Panel de filtros */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>Filtros</span>
          {activeFilterCount > 0 && (
            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: '700' }}>
              {activeFilterCount} activo{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>INSTITUCIÓN</label>
            <select className="input" style={{ width: '100%', height: '36px', fontSize: '0.8rem' }}
              value={filters.id_institucion} onChange={e => setFilter('id_institucion', e.target.value)}>
              <option value="">Todas las II.EE.</option>
              {filterData.instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>PERIODO</label>
            <select className="input" style={{ width: '100%', height: '36px', fontSize: '0.8rem' }}
              value={filters.id_periodo} onChange={e => setFilter('id_periodo', e.target.value)}>
              <option value="">Todos los periodos</option>
              {filterData.periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>INSTRUMENTO</label>
            <select className="input" style={{ width: '100%', height: '36px', fontSize: '0.8rem' }}
              value={filters.id_ficha} onChange={e => setFilter('id_ficha', e.target.value)}>
              <option value="">Todas las fichas</option>
              {filterData.fichas.map(f => <option key={f.id_ficha} value={f.id_ficha}>{f.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>DOCENTE</label>
            <select className="input" style={{ width: '100%', height: '36px', fontSize: '0.8rem' }}
              value={filters.id_docente} onChange={e => setFilter('id_docente', e.target.value)}>
              <option value="">Todos los docentes</option>
              {filterData.docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>NIVEL DE DESEMPEÑO</label>
            <select className="input" style={{ width: '100%', height: '36px', fontSize: '0.8rem' }}
              value={filters.nivel_desempeno} onChange={e => setFilter('nivel_desempeno', e.target.value)}>
              <option value="">Todos los niveles</option>
              {nivelesDisponibles.map(n => <option key={n.id_nivel || n.nombre} value={n.nombre}>{n.nombre}</option>)}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-outline" onClick={clearFilters}
                style={{ height: '36px', fontSize: '0.8rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                <X size={13} /> Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard title="Total Monitoreos"   value={stats?.kpis?.total_monitoreos || '0'}    icon={<ClipboardCheck size={22} />} accent="#2563eb" />
        <StatCard title="Promedio General"   value={stats?.kpis?.promedio_general || '0.00'} icon={<TrendingUp size={22} />}    accent="#10b981" />
        <StatCard title="Docentes Evaluados" value={stats?.kpis?.total_docentes || '0'}      icon={<Users size={22} />}         accent="#8b5cf6" />
        <StatCard
          title={`Bajo desempeño${niveles.length > 0 ? ' (' + String.fromCharCode(8804) + niveles[0].puntaje_maximo + ' pts)' : ''}`}
          value={stats?.kpis?.alertas_bajo_desempeno || '0'}
          icon={<AlertTriangle size={22} />} accent="#ef4444"
        />
      </div>

      {/* Gráficas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Evolución del Promedio</h3>
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
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Distribución General</h3>
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
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Niveles de Tutoría</h3>
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

      {/* Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <RankingPanel
          title="Ranking Docentes"
          icon={<Award size={17} />}
          accentColor="var(--primary)"
          dataMap={docentesData}
          badge={filters.nivel_desempeno ? (
            <span style={{
              fontSize: '0.7rem', fontWeight: '700', padding: '0.18rem 0.55rem', borderRadius: '2rem',
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              border: '1px solid var(--primary)44'
            }}>{filters.nivel_desempeno}</span>
          ) : null}
        />
        <RankingPanel
          title="Ranking Tutores"
          icon={<Users size={17} />}
          accentColor="#8b5cf6"
          dataMap={tutoresData}
          badge={filters.nivel_desempeno ? (
            <span style={{
              fontSize: '0.7rem', fontWeight: '700', padding: '0.18rem 0.55rem', borderRadius: '2rem',
              backgroundColor: '#f3e8ff', color: '#8b5cf6',
              border: '1px solid #8b5cf644'
            }}>{filters.nivel_desempeno}</span>
          ) : null}
        />
      </div>

      {/* Ranking Acumulado */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--primary-light)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--primary)' }}>Ranking por Puntaje Acumulado</h3>
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
              <li><strong>Filtros independientes:</strong> Cada filtro actúa por separado. Sin filtro activo se muestran todos los datos.</li>
              <li><strong>Instrumento (Ficha):</strong> Filtra todos los datos por el instrumento de monitoreo seleccionado.</li>
              <li><strong>Nivel de desempeño:</strong> Filtra los rankings para mostrar solo docentes en ese nivel.</li>
              <li><strong>Ranking Docentes/Tutores:</strong> Separados por nivel educativo (Primaria / Secundaria).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;
