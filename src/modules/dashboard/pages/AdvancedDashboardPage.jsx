import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { 
  Users, Award, AlertTriangle, TrendingUp, Filter, Calendar, BookOpen, School, Search, ChevronRight, FileText
} from 'lucide-react';

const AdvancedDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filters, setFilters] = useState({
    id_institucion: '',
    id_periodo: '',
    id_ficha: '',
    id_docente: ''
  });
  
  // Data for filters
  const [filterData, setFilterData] = useState({
    instituciones: [],
    periodos: [],
    fichas: [],
    docentes: []
  });

  const fetchFilters = async () => {
    try {
      const [inst, per, fic, doc] = await Promise.all([
        api.get('/instituciones'),
        api.get('/periodos'),
        api.get('/fichas'),
        api.get('/docentes')
      ]);
      setFilterData({
        instituciones: inst.data,
        periodos: per.data,
        fichas: fic.data,
        docentes: doc.data
      });
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

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && !stats) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando análisis avanzado...</div>;

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header & Global Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Dashboard de Monitoreo</h1>
          <p style={{ color: 'var(--text-muted)' }}>Análisis educativo y seguimiento de desempeño docente (Nivel UGEL)</p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.25rem', 
          borderRadius: '1rem', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Filtros:</span>
          </div>
          
          <select className="input" style={{ width: '180px', height: '38px', fontSize: '0.8125rem' }} 
            value={filters.id_institucion} onChange={e => setFilters({...filters, id_institucion: e.target.value})}>
            <option value="">Todas las II.EE.</option>
            {filterData.instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
          </select>

          <select className="input" style={{ width: '150px', height: '38px', fontSize: '0.8125rem' }}
            value={filters.id_periodo} onChange={e => setFilters({...filters, id_periodo: e.target.value})}>
            <option value="">Todos los Periodos</option>
            {filterData.periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
          </select>

          <select className="input" style={{ width: '180px', height: '38px', fontSize: '0.8125rem' }}
            value={filters.id_docente} onChange={e => setFilters({...filters, id_docente: e.target.value})}>
            <option value="">Todos los Docentes</option>
            {filterData.docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
          </select>
          
          <button className="btn btn-outline" style={{ height: '38px' }} onClick={() => setFilters({id_institucion: '', id_periodo: '', id_ficha: '', id_docente: ''})}>
            Limpiar
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <KPICard title="Promedio General" value={stats?.kpis?.promedio_general || '0.00'} icon={<TrendingUp color="#2563eb" />} color="#dbeafe" />
        <KPICard title="Docentes Evaluados" value={stats?.kpis?.total_docentes || '0'} icon={<Users color="#10b981" />} color="#dcfce7" />
        <KPICard title="Total Monitoreos" value={stats?.kpis?.total_monitoreos || '0'} icon={<FileText color="#8b5cf6" />} color="#f3e8ff" />
        <KPICard title="Alertas de Desempeño" value={stats?.kpis?.alertas_bajo_desempeno || '0'} icon={<AlertTriangle color="#ef4444" />} color="#fee2e2" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Main Chart: Evolution */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Evolución del Desempeño Docente</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Promedio por Fecha</span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.evolucion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} 
                  tickFormatter={(str) => new Date(str).toLocaleDateString()} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelFormatter={(str) => `Fecha: ${new Date(str).toLocaleDateString()}`}
                />
                <Line type="monotone" dataKey="promedio" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Institution Stats */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Desempeño por Institución</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.porInstitucion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} width={100} />
                <Tooltip />
                <Bar dataKey="promedio" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats?.porInstitucion?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Teacher Ranking */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>🏆 12 (Top 10)</h3>
            <Award size={20} color="var(--primary)" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Docente</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>I.E.</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Promedio</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nivel</th>
                </tr>
              </thead>
              <tbody>
                {stats?.rankingDocentes?.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>{d.nombre_docente}</td>
                    <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{d.institucion}</td>
                    <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--primary)' }}>{d.promedio}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{d.nivel_final || 'Previsto'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed History (If selected) or Alerts */}
        {filters.id_docente ? (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" /> Historial del Docente
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats?.historialDocente?.map((h, i) => (
                <div key={i} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '700' }}>Visita #{h.numero_visita}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.fecha).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem' }}>{h.puntaje_total} pts</div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}><strong>Monitor:</strong> {h.monitor}</p>
                  {h.observaciones_generales && (
                    <div style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '0.4rem' }}>
                      <strong>Obs:</strong> {h.observaciones_generales.substring(0, 100)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#ef4444" /> Alertas de Seguimiento
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#fff1f2', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
                <p style={{ fontWeight: '700', color: '#991b1b', marginBottom: '0.25rem' }}>Bajo Desempeño Crítico</p>
                <p style={{ fontSize: '0.8125rem', color: '#b91c1c' }}>Se han detectado {stats?.kpis?.alertas_bajo_desempeno} docentes con puntajes menores a 50 puntos en el periodo actual.</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fef3c7' }}>
                <p style={{ fontWeight: '700', color: '#92400e', marginBottom: '0.25rem' }}>Evaluaciones Próximas</p>
                <p style={{ fontSize: '0.8125rem', color: '#b45309' }}>Hay docentes que no han recibido su segunda visita de monitoreo en este periodo.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s', cursor: 'default' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '1rem', backgroundColor: color, display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '1rem' }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{title}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{value}</p>
    </div>
  </div>
);

export default AdvancedDashboardPage;
