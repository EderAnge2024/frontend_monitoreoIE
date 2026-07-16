import { useState, useEffect } from 'react';
import React from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Download, Filter, X, User, BarChart2 } from 'lucide-react';

const TendenciaBadge = ({ visitas }) => {
  if (visitas.length < 2) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>;
  const diff = visitas[visitas.length - 1].puntaje - visitas[0].puntaje;
  if (diff > 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: '700', fontSize: '0.8rem' }}>
      <TrendingUp size={14} /> Mejora (+{diff.toFixed(1)})
    </span>
  );
  if (diff < 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontWeight: '700', fontSize: '0.8rem' }}>
      <TrendingDown size={14} /> Baja ({diff.toFixed(1)})
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: '700', fontSize: '0.8rem' }}>
      <Minus size={14} /> Estable
    </span>
  );
};

const NivelBadge = ({ nombre, color }) => (
  <span style={{
    display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: '2rem',
    fontSize: '0.68rem', fontWeight: '700',
    backgroundColor: color ? `${color}22` : '#eff6ff',
    color: color || 'var(--primary)',
    border: `1px solid ${color ? color + '44' : 'var(--primary)44'}`,
  }}>{nombre || 'Sin nivel'}</span>
);

const EMPTY = { id_institucion: '', id_periodo: '', id_ficha: '' };

const SeguimientoPage = () => {
  const { user } = useAuth();
  const [docentes, setDocentes]     = useState([]);
  const [filterData, setFilterData] = useState({ instituciones: [], periodos: [], fichas: [] });
  const [filters, setFilters]       = useState(EMPTY);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [niveles, setNiveles]       = useState([]);
  
  const [analisisData, setAnalisisData] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    const load = async () => {
      try {
        const [inst, per, fic, niv] = await Promise.all([
          api.get('/instituciones'), api.get('/periodos'),
          api.get('/fichas'), api.get('/niveles'),
        ]);
        setFilterData({ instituciones: inst.data, periodos: per.data, fichas: fic.data });
        setNiveles(niv.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSelectedDocente(null);
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
        const res = await api.get(`/monitoreos/seguimiento?${new URLSearchParams(params)}`);
        setDocentes(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [filters]);

  useEffect(() => {
    const fetchAnalisis = async () => {
      if (!filters.id_ficha) {
        setAnalisisData(null);
        return;
      }
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
        if (selectedDocente) {
          params.id_docente = selectedDocente.id_docente;
        }
        const res = await api.get(`/monitoreos/seguimiento/analisis?${new URLSearchParams(params)}`);
        setAnalisisData(res.data);
      } catch (err) {
        console.error('Error cargando análisis:', err);
      }
    };
    fetchAnalisis();
  }, [filters, selectedDocente]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters(EMPTY);
  const activeCount = Object.values(filters).filter(v => v !== '').length;

  const handleExcel = async () => {
    setDownloading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await api.get(`/monitoreos/export/excel?${new URLSearchParams(params)}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Seguimiento_Docentes_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Usar setTimeout para asegurar que el click se procesó antes de limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error al exportar:', err);
      alert('Error al generar el archivo Excel. Intente nuevamente.');
    } finally {
      setDownloading(false);
    }
  };

  const filtered = docentes.filter(d => {
    if (!searchTerm) return true;
    return `${d.nombre_docente} ${d.institucion}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const nivelLines = niveles.map(n => ({
    y: parseFloat(n.puntaje_minimo),
    label: n.nombre,
    color: n.color || '#94a3b8'
  }));

  const formatAnalisisData = () => {
    if (!analisisData) return { chartData: [], visitas: [], chartDataSiNo: [], visitasSiNo: [] };
    const result = {};
    const resultSiNo = {};
    const visitasMap = new Map(); // key → label visible
    const visitasSiNoMap = new Map();

    // Procesar preguntas con puntaje
    analisisData.datos.forEach(row => {
      if (!result[row.id_pregunta]) {
        const nameTrunc = row.pregunta.length > 30 ? row.pregunta.substring(0, 30) + '...' : row.pregunta;
        result[row.id_pregunta] = { name: nameTrunc, fullName: row.pregunta, categoria: row.categoria };
      }
      // Incluir el período en la clave para diferenciar bimestres
      const visKey = row.periodo_nombre
        ? `${row.periodo_nombre} - V${row.numero_visita}`
        : `Visita ${row.numero_visita}`;
      visitasMap.set(visKey, visKey);
      result[row.id_pregunta][visKey] = parseFloat(row.promedio_puntaje);
    });

    // Procesar preguntas Sí/No
    if (analisisData.preguntasSiNo) {
      analisisData.preguntasSiNo.forEach(row => {
        if (!resultSiNo[row.id_pregunta]) {
          const nameTrunc = row.pregunta.length > 30 ? row.pregunta.substring(0, 30) + '...' : row.pregunta;
          resultSiNo[row.id_pregunta] = { 
            name: nameTrunc, 
            fullName: row.pregunta, 
            categoria: row.categoria 
          };
        }
        const visKey = row.periodo_nombre
          ? `${row.periodo_nombre} - V${row.numero_visita}`
          : `Visita ${row.numero_visita}`;
        visitasSiNoMap.set(visKey, visKey);
        
        // Calcular porcentajes para Sí/No
        const totalSi = parseInt(row.total_si) || 0;
        const totalNo = parseInt(row.total_no) || 0;
        const total = totalSi + totalNo;
        
        if (total > 0) {
          resultSiNo[row.id_pregunta][`${visKey}_Si`] = Math.round((totalSi / total) * 100);
          resultSiNo[row.id_pregunta][`${visKey}_No`] = Math.round((totalNo / total) * 100);
        }
      });
    }

    return {
      chartData: Object.values(result),
      visitas: Array.from(visitasMap.keys()),
      chartDataSiNo: Object.values(resultSiNo),
      visitasSiNo: Array.from(visitasSiNoMap.keys())
    };
  };

  const chartInfo = formatAnalisisData();

  // Paleta diferenciada: un color único por cada tipo de monitoreo/período
  const MONITOREO_COLORS = [
    '#2563eb', // Azul fuerte — Diagnóstico inicial
    '#10b981', // Verde esmeralda — Primer seguimiento  
    '#f59e0b', // Ámbar — Segundo seguimiento
    '#8b5cf6', // Violeta — Tercer seguimiento
    '#ef4444', // Rojo — Evaluación final
    '#06b6d4', // Cian — Monitoreo adicional
    '#f97316', // Naranja — Refuerzo
    '#84cc16', // Lima — Mejora continua
    '#ec4899', // Rosa — Evaluación especial
    '#6366f1', // Índigo — Monitoreo integral
  ];

  // Función para obtener color basado en el tipo de visita o período
  const getColorForVisita = (visitaLabel, index) => {
    // Priorizar por tipo de monitoreo si está en el label
    if (visitaLabel.toLowerCase().includes('diagnóstico') || visitaLabel.toLowerCase().includes('inicial')) return MONITOREO_COLORS[0];
    if (visitaLabel.toLowerCase().includes('1er') || visitaLabel.toLowerCase().includes('primer')) return MONITOREO_COLORS[1];
    if (visitaLabel.toLowerCase().includes('2do') || visitaLabel.toLowerCase().includes('segundo')) return MONITOREO_COLORS[2];
    if (visitaLabel.toLowerCase().includes('3er') || visitaLabel.toLowerCase().includes('tercer')) return MONITOREO_COLORS[3];
    if (visitaLabel.toLowerCase().includes('4to') || visitaLabel.toLowerCase().includes('final')) return MONITOREO_COLORS[4];
    
    // Si no hay coincidencia, usar índice rotativo
    return MONITOREO_COLORS[index % MONITOREO_COLORS.length];
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Seguimiento de Progreso Docente
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Evolución del desempeño por monitoreo. Exporta a Excel para un informe completo.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleExcel}
          disabled={downloading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={17} />
          {downloading ? 'Generando...' : 'Exportar Excel'}
        </button>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Filter size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>Filtros</span>
          {activeCount > 0 && (
            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.1rem 0.45rem', borderRadius: '1rem', fontWeight: '700' }}>
              {activeCount}
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
              <option value="">Todos los instrumentos</option>
              {filterData.fichas.map(f => <option key={f.id_ficha} value={f.id_ficha}>{f.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>BUSCAR DOCENTE</label>
            <input className="input" style={{ width: '100%', height: '36px', fontSize: '0.8rem' }}
              placeholder="Nombre o institución..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {activeCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-outline" onClick={clearFilters}
                style={{ height: '36px', width: '100%', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                <X size={13} /> Limpiar
              </button>
            </div>
          )}
        </div>
        {!filters.id_ficha && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--primary)' }}>
            💡 Selecciona un instrumento en los filtros para ver el análisis avanzado de criterios.
          </p>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos de seguimiento...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <User size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>Sin datos con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          {!selectedDocente && filters.id_ficha && (analisisData?.tipo === 'general' || user?.role === 'docente') && (
            <>
              <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem', minHeight: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <BarChart2 color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                    {user?.role === 'docente' ? 'Mi Análisis Histórico por Criterio' : 'Análisis Institucional por Criterio'}
                  </h3>
                </div>
                
                {/* Leyenda de colores para tipos de monitoreo */}
                {chartInfo.visitas.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.75rem', 
                    marginBottom: '1.5rem',
                    padding: '0.75rem', 
                    backgroundColor: 'var(--background)', 
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                      Tipos de Monitoreo:
                    </span>
                    {chartInfo.visitas.map((visKey, index) => (
                      <div key={visKey} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem',
                        fontSize: '0.7rem'
                      }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          backgroundColor: getColorForVisita(visKey, index),
                          borderRadius: '2px'
                        }} />
                        <span style={{ fontWeight: '600' }}>{visKey}</span>
                      </div>
                    ))}
                  </div>
                )}

                {chartInfo.chartData.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando datos del análisis...</p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartInfo.chartData} margin={{ top: 20, right: 0, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} angle={-45} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.8rem', maxWidth: '350px', whiteSpace: 'normal' }}
                        labelFormatter={(label, data) => data[0]?.payload?.fullName || label}
                        formatter={(value, name) => [
                          `${value} pts`,
                          name
                        ]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem' }} />
                      {chartInfo.visitas.map((visKey, index) => (
                        <Bar 
                          key={visKey} 
                          dataKey={visKey} 
                          fill={getColorForVisita(visKey, index)} 
                          radius={[2, 2, 0, 0]} 
                          maxBarSize={30}
                          name={visKey}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Nueva sección para preguntas Sí/No */}
              {chartInfo.chartDataSiNo.length > 0 && (
                <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem', minHeight: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <BarChart2 color="var(--success)" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--success)' }}>
                      Preguntas de Respuesta Sí/No - Análisis de Cumplimiento
                    </h3>
                  </div>
                  
                  {/* Leyenda específica para Sí/No */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '1rem', 
                    marginBottom: '1.5rem',
                    padding: '0.75rem', 
                    backgroundColor: 'var(--background)', 
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Respuestas "Sí" (%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Respuestas "No" (%)</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartInfo.chartDataSiNo} margin={{ top: 20, right: 0, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} angle={-45} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.8rem', maxWidth: '350px', whiteSpace: 'normal' }}
                        labelFormatter={(label, data) => data[0]?.payload?.fullName || label}
                        formatter={(value, name) => {
                          const isNoResponse = name.includes('_No');
                          const cleanName = name.replace(/_Si|_No/, '');
                          const responseType = isNoResponse ? 'No' : 'Sí';
                          return [`${value}%`, `${cleanName} - ${responseType}`];
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem' }} />
                      {chartInfo.visitasSiNo.map((visKey) => (
                        <React.Fragment key={visKey}>
                          <Bar 
                            dataKey={`${visKey}_Si`} 
                            stackId={visKey}
                            fill="#10b981" 
                            radius={[2, 2, 0, 0]} 
                            maxBarSize={30}
                            name={`${visKey} - Sí`}
                          />
                          <Bar 
                            dataKey={`${visKey}_No`} 
                            stackId={visKey}
                            fill="#ef4444" 
                            radius={[2, 2, 0, 0]} 
                            maxBarSize={30}
                            name={`${visKey} - No`}
                          />
                        </React.Fragment>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: selectedDocente ? '1fr 1.6fr' : '1fr', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{filtered.length} docente{filtered.length !== 1 ? 's' : ''}</span>
                {selectedDocente && (
                  <button onClick={() => { setSelectedDocente(null); setActiveTab('resumen'); }} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Cerrar detalle ✕
                  </button>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--background)' }}>
                      {['Docente', 'Institución', 'Visitas', 'Promedio', 'Tendencia', 'Último Nivel'].map((h, i) => (
                        <th key={i} style={{ padding: '0.65rem 0.9rem', fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => {
                      const isSelected = selectedDocente?.id_docente === d.id_docente;
                      return (
                        <tr key={d.id_docente}
                          onClick={() => { setSelectedDocente(isSelected ? null : d); setActiveTab('resumen'); }}
                          style={{
                            borderBottom: '1px solid var(--border)', cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.03)'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <td style={{ padding: '0.75rem 0.9rem' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.82rem' }}>{d.nombre_docente}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.nivel_educativo || '—'}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.9rem', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.institucion}</td>
                          <td style={{ padding: '0.75rem 0.9rem', fontSize: '0.8rem', textAlign: 'center', fontWeight: '700' }}>{d.visitas.length}</td>
                          <td style={{ padding: '0.75rem 0.9rem', fontWeight: '800', fontSize: '0.88rem', color: 'var(--primary)' }}>{d.promedio}</td>
                          <td style={{ padding: '0.75rem 0.9rem' }}><TendenciaBadge visitas={d.visitas} /></td>
                          <td style={{ padding: '0.75rem 0.9rem' }}>
                            <NivelBadge nombre={d.nivel_final} color={d.nivel_color} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedDocente && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="fade-in">
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: '800' }}>{selectedDocente.nombre_docente}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedDocente.institucion} · {selectedDocente.nivel_educativo || '—'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: selectedDocente.nivel_color || 'var(--primary)' }}>{selectedDocente.promedio} pts</div>
                      <NivelBadge nombre={selectedDocente.nivel_final} color={selectedDocente.nivel_color} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                  <button onClick={() => setActiveTab('resumen')} 
                    style={{ 
                      padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: activeTab === 'resumen' ? '2px solid var(--primary)' : '2px solid transparent', 
                      color: activeTab === 'resumen' ? 'var(--primary)' : 'var(--text-muted)', 
                      fontWeight: activeTab === 'resumen' ? '700' : '600'
                    }}>
                    Evolución General
                  </button>
                  <button onClick={() => setActiveTab('analisis')} 
                    style={{ 
                      padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: activeTab === 'analisis' ? '2px solid var(--primary)' : '2px solid transparent', 
                      color: activeTab === 'analisis' ? 'var(--primary)' : 'var(--text-muted)', 
                      fontWeight: activeTab === 'analisis' ? '700' : '600',
                      display: 'flex', alignItems: 'center', gap: '0.35rem'
                    }}
                    disabled={!filters.id_ficha}>
                    <BarChart2 size={16} /> Análisis por Criterios {(!filters.id_ficha) && "(Filtrar por ficha)"}
                  </button>
                </div>

                {activeTab === 'resumen' ? (
                  <>
                    <div className="card fade-in" style={{ padding: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: '700' }}>Evolución del Puntaje por Visita</h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={selectedDocente.visitas} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="numero" axisLine={false} tickLine={false}
                            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                            tickFormatter={v => `V${v}`} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                            formatter={(val, name, props) => [
                              `${val} pts — ${props.payload.nivel}`,
                              `${props.payload.instrumento} (${props.payload.fecha})`
                            ]}
                            labelFormatter={(label) => `Visita ${label}`}
                          />
                          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.75rem' }} />
                          {nivelLines.map((nl, i) => (
                            <ReferenceLine key={i} y={nl.y} stroke={nl.color} strokeDasharray="4 3" strokeWidth={1.5}
                              label={{ value: nl.label, position: 'insideTopRight', fontSize: 9, fill: nl.color }} />
                          ))}
                          <Line 
                            type="monotone" 
                            dataKey="puntaje" 
                            stroke="var(--primary)" 
                            strokeWidth={3}
                            dot={(props) => {
                              const { cx, cy, payload } = props;
                              const color = getColorForVisita(payload.instrumento || 'general', payload.numero || 0);
                              return (
                                <circle 
                                  cx={cx} 
                                  cy={cy} 
                                  r={6} 
                                  fill={color} 
                                  stroke="white" 
                                  strokeWidth={2}
                                />
                              );
                            }}
                            activeDot={{ r: 8, stroke: 'var(--primary)', strokeWidth: 2 }}
                            name="Puntaje"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="card fade-in" style={{ padding: '0', overflow: 'hidden' }}>
                      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: '700', fontSize: '0.85rem' }}>Historial de Visitas</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--background)' }}>
                            {['Visita', 'Fecha', 'Instrumento', 'Puntaje', 'Nivel'].map((h, i) => (
                              <th key={i} style={{ padding: '0.6rem 1rem', fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDocente.visitas.map((v, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.65rem 1rem', fontWeight: '700', color: 'var(--primary)', fontSize: '0.82rem' }}>#{v.numero}</td>
                              <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.fecha}</td>
                              <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.instrumento}</td>
                              <td style={{ padding: '0.65rem 1rem', fontWeight: '800', fontSize: '0.9rem', color: v.nivel_color || 'var(--primary)' }}>{v.puntaje}</td>
                              <td style={{ padding: '0.65rem 1rem' }}><NivelBadge nombre={v.nivel} color={v.nivel_color} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="card fade-in" style={{ padding: '1.5rem', minHeight: '300px', marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: '700' }}>Comparación Histórica por Pregunta</h4>
                      
                      {/* Leyenda de colores para tipos de monitoreo */}
                      {chartInfo.visitas.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '0.75rem', 
                          marginBottom: '1.5rem',
                          padding: '0.75rem', 
                          backgroundColor: 'var(--background)', 
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)'
                        }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                            Tipos de Monitoreo:
                          </span>
                          {chartInfo.visitas.map((visKey, index) => (
                            <div key={visKey} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.35rem',
                              fontSize: '0.7rem'
                            }}>
                              <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: getColorForVisita(visKey, index),
                                borderRadius: '2px'
                              }} />
                              <span style={{ fontWeight: '600' }}>{visKey}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!analisisData || chartInfo.chartData.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando datos del análisis...</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={chartInfo.chartData} margin={{ top: 20, right: 0, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} angle={-45} textAnchor="end" />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.8rem', maxWidth: '350px', whiteSpace: 'normal' }}
                              labelFormatter={(label, data) => data[0]?.payload?.fullName || label}
                              formatter={(value, name) => [
                                `${value} pts`,
                                name
                              ]}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem' }} />
                            {chartInfo.visitas.map((visKey, index) => (
                              <Bar 
                                key={visKey} 
                                dataKey={visKey} 
                                fill={getColorForVisita(visKey, index)} 
                                radius={[2, 2, 0, 0]} 
                                maxBarSize={30}
                                name={visKey}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Sección de preguntas Sí/No para vista individual */}
                    {chartInfo.chartDataSiNo.length > 0 && (
                      <div className="card fade-in" style={{ padding: '1.5rem', minHeight: '300px' }}>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--success)' }}>
                          Preguntas Sí/No - Análisis de Cumplimiento Individual
                        </h4>
                        
                        {/* Leyenda específica para Sí/No */}
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '1rem', 
                          marginBottom: '1.5rem',
                          padding: '0.75rem', 
                          backgroundColor: 'var(--background)', 
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Respuestas "Sí" (%)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Respuestas "No" (%)</span>
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={chartInfo.chartDataSiNo} margin={{ top: 20, right: 0, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} angle={-45} textAnchor="end" />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.8rem', maxWidth: '350px', whiteSpace: 'normal' }}
                              labelFormatter={(label, data) => data[0]?.payload?.fullName || label}
                              formatter={(value, name) => {
                                const isNoResponse = name.includes('_No');
                                const cleanName = name.replace(/_Si|_No/, '');
                                const responseType = isNoResponse ? 'No' : 'Sí';
                                return [`${value}%`, `${cleanName} - ${responseType}`];
                              }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem' }} />
                            {chartInfo.visitasSiNo.map((visKey) => (
                              <React.Fragment key={visKey}>
                                <Bar 
                                  dataKey={`${visKey}_Si`} 
                                  stackId={visKey}
                                  fill="#10b981" 
                                  radius={[2, 2, 0, 0]} 
                                  maxBarSize={30}
                                  name={`${visKey} - Sí`}
                                />
                                <Bar 
                                  dataKey={`${visKey}_No`} 
                                  stackId={visKey}
                                  fill="#ef4444" 
                                  radius={[2, 2, 0, 0]} 
                                  maxBarSize={30}
                                  name={`${visKey} - No`}
                                />
                              </React.Fragment>
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SeguimientoPage;
