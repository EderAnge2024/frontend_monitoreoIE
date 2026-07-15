import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
  Search, Eye, Calendar, Filter, ClipboardCheck,
  ArrowLeft, ChevronUp, ChevronDown, BookOpen, X, Trash2
} from 'lucide-react';

const statusBadge = (estado) => {
  const map = {
    completado: { bg: '#ecfdf5', color: '#059669', label: 'Completado' },
    en_proceso:  { bg: '#fffbeb', color: '#d97706', label: 'En Proceso' },
    pendiente:   { bg: '#fef2f2', color: '#dc2626', label: 'Pendiente'  },
  };
  const s = map[estado] || map['en_proceso'];
  return (
    <span style={{
      padding: '0.25rem 0.65rem', borderRadius: '1rem',
      fontSize: '0.72rem', fontWeight: '700',
      backgroundColor: s.bg, color: s.color
    }}>{s.label}</span>
  );
};

const scoreColor = (p) => {
  if (!p && p !== 0) return 'var(--text-muted)';
  if (p >= 75) return '#059669';
  if (p >= 50) return '#d97706';
  return '#dc2626';
};

const HistorialMonitoreoPage = () => {
  const { user } = useAuth();
  const isAdmin    = user?.role === 'administrador';
  const isDirector = user?.role === 'director';
  const isDocente  = user?.role === 'docente';

  const [monitoreos, setMonitoreos]       = useState([]);
  const [periodos, setPeriodos]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedMonitoreo, setSelected]  = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [sortDir, setSortDir]             = useState('desc');
  const [selectedToDelete, setSelectedToDelete] = useState(null);

  // Filters
  const [search, setSearch]           = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('');
  const [filtroTipo, setFiltroTipo]       = useState('');

  const fetchPeriodos = async () => {
    try {
      const r = await api.get('/periodos');
      setPeriodos(r.data);
    } catch (_) {}
  };

  const fetchMonitoreos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)        params.set('search', search);
      if (filtroPeriodo) params.set('id_periodo', filtroPeriodo);
      if (filtroEstado)  params.set('estado', filtroEstado);
      if (filtroTipo)    params.set('tipo_monitoreo', filtroTipo);

      const r = await api.get(`/monitoreos/historial?${params.toString()}`);
      setMonitoreos(r.data);
    } catch (err) {
      console.error('Error fetching historial:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filtroPeriodo, filtroEstado, filtroTipo]);

  useEffect(() => { fetchPeriodos(); }, []);
  useEffect(() => { fetchMonitoreos(); }, [fetchMonitoreos]);

  const handleViewDetail = async (id) => {
    try {
      const r = await api.get(`/monitoreos/${id}`);
      setSelected(r.data);
      setShowModal(true);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este monitoreo? Esta acción borrará las respuestas y el puntaje permanentemente.')) return;
    try {
      await api.delete(`/monitoreos/${id}`);
      setSelectedToDelete(null);
      fetchMonitoreos();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al eliminar el monitoreo');
    }
  };

  const sorted = [...monitoreos].sort((a, b) => {
    const da = new Date(a.fecha), db = new Date(b.fecha);
    return sortDir === 'desc' ? db - da : da - db;
  });

  const clearFilters = () => {
    setSearch(''); setFiltroPeriodo(''); setFiltroEstado(''); setFiltroTipo('');
  };
  const hasFilters = search || filtroPeriodo || filtroEstado || filtroTipo;

  const headerTitle = isDocente
    ? 'Mis Monitoreos Recibidos'
    : isDirector
    ? 'Historial de Monitoreos — Mi IE'
    : 'Historial de Monitoreos — Todos';

  const headerDesc = isDocente
    ? 'Revisa las evaluaciones pedagógicas que has recibido de tus monitores.'
    : isDirector
    ? 'Todos los monitoreos registrados para los docentes de tu institución educativa.'
    : 'Vista global de todos los monitoreos registrados en el sistema.';

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(37,99,235,0.05) 100%)',
        border: '1px solid var(--border)', borderRadius: '1rem',
        padding: '2rem', marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <ClipboardCheck size={30} color="var(--primary)" />
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            {headerTitle}
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>{headerDesc}</p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder={isDocente ? 'Buscar por instrumento...' : 'Buscar docente, instrumento, IE...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
          />
        </div>

        {/* Periodo */}
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}
          className="input" style={{ flex: '1 1 180px', fontSize: '0.875rem', cursor: 'pointer' }}>
          <option value="">Todos los períodos</option>
          {periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
        </select>

        {/* Estado */}
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="input" style={{ flex: '0 1 160px', fontSize: '0.875rem', cursor: 'pointer' }}>
          <option value="">Todos los estados</option>
          <option value="completado">Completado</option>
          <option value="en_proceso">En Proceso</option>
          <option value="pendiente">Pendiente</option>
        </select>

        {/* Tipo */}
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="input" style={{ flex: '0 1 160px', fontSize: '0.875rem', cursor: 'pointer' }}>
          <option value="">Todos los tipos</option>
          <option value="Docente">Docente</option>
          <option value="Tutor">Tutor</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.5rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #ef444440',
            backgroundColor: 'transparent', color: '#ef4444', fontSize: '0.82rem',
            fontWeight: '600', cursor: 'pointer'
          }}>
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {/* Table header bar */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
            {loading ? 'Cargando...' : `${sorted.length} monitoreo${sorted.length !== 1 ? 's' : ''} encontrado${sorted.length !== 1 ? 's' : ''}`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAdmin && selectedToDelete && (
              <button
                className="btn btn-outline"
                onClick={() => handleDelete(selectedToDelete)}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', 
                  fontSize: '0.78rem', fontWeight: '600', color: '#dc2626', borderColor: 'rgba(220,38,38,0.2)' 
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.05)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={13} /> Eliminar Seleccionado
              </button>
            )}
            <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              Fecha {sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(37,99,235,0.15)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            Cargando monitoreos...
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)' }}>Sin resultados</h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {hasFilters ? 'No hay monitoreos que coincidan con los filtros aplicados.' : 'Aún no hay monitoreos registrados.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.025)', borderBottom: '1px solid var(--border)' }}>
                  {isAdmin && <th style={{ padding: '0.875rem 1rem', width: '40px' }}></th>}
                  {['FECHA', ...(isDocente ? [] : ['DOCENTE']), 'INSTRUMENTO', ...(isAdmin ? ['INSTITUCIÓN'] : []), 'EVALUADOR', 'VISITA', 'TIPO', 'PUNTAJE', 'NIVEL', 'ESTADO', ''].map((h) => (
                    <th key={h || 'accion'} style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(m => (
                  <tr key={m.id_monitoreo} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    {isAdmin && (
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <input 
                          type="radio" 
                          name="monitoreoSelect" 
                          checked={selectedToDelete === m.id_monitoreo} 
                          onChange={() => setSelectedToDelete(m.id_monitoreo)} 
                          style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} />
                        {new Date(m.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    {!isDocente && (
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>{m.docente_nombres} {m.docente_apellidos}</div>
                      </td>
                    )}
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{m.ficha_nombre}</span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.institucion_nombre}</td>
                    )}
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.evaluador_nombres} {m.evaluador_apellidos}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'left' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary)' }}>#{m.numero_visita}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: m.tipo_monitoreo === 'Tutor' ? '#f3e8ff' : '#eff6ff', color: m.tipo_monitoreo === 'Tutor' ? '#7c3aed' : '#2563eb' }}>
                        {m.tipo_monitoreo || 'Docente'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: '800', fontSize: '1.05rem', color: m.nivel_color || scoreColor(m.puntaje_total) }}>
                        {m.puntaje_total ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {m.nivel_final ? (
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '2rem',
                          fontSize: '0.7rem', fontWeight: '700',
                          backgroundColor: m.nivel_color ? `${m.nivel_color}22` : 'var(--primary-light)',
                          color: m.nivel_color || 'var(--primary)',
                          border: `1px solid ${m.nivel_color ? m.nivel_color + '44' : 'var(--primary)44'}`
                        }}>
                          {m.nivel_final}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>{statusBadge(m.estado)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleViewDetail(m.id_monitoreo)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.78rem', fontWeight: '600' }}
                        >
                          <Eye size={13} /> Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedMonitoreo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: '1rem' }}>
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10, borderRadius: '1rem 1rem 0 0' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Detalle de Monitoreo</h2>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
                <ArrowLeft size={15} /> Cerrar
              </button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem', backgroundColor: 'var(--background)', padding: '1.25rem', borderRadius: '0.75rem' }}>
                {[
                  ['Docente Evaluado', `${selectedMonitoreo.docente_nombres} ${selectedMonitoreo.docente_apellidos}`],
                  ['Monitor', `${selectedMonitoreo.evaluador_nombres} ${selectedMonitoreo.evaluador_apellidos}`],
                  ['Instrumento', selectedMonitoreo.ficha_nombre],
                  ['Fecha / Visita', `${new Date(selectedMonitoreo.fecha).toLocaleDateString('es-PE')} — Visita #${selectedMonitoreo.numero_visita}`],
                  ['Área', selectedMonitoreo.area || '—'],
                  ['Sesión', selectedMonitoreo.sesion || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{value}</p>
                  </div>
                ))}
                <div>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puntaje Total</p>
                  <p style={{ margin: '0.2rem 0 0', fontWeight: '900', fontSize: '1.4rem', color: selectedMonitoreo.nivel_color || scoreColor(selectedMonitoreo.puntaje_total) }}>{selectedMonitoreo.puntaje_total ?? '—'} pts</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nivel</p>
                  <p style={{ margin: '0.2rem 0 0', fontWeight: '700', fontSize: '0.95rem', color: selectedMonitoreo.nivel_color || 'var(--text-main)' }}>{selectedMonitoreo.nivel_final || 'Sin Nivel'}</p>
                </div>
              </div>

              {/* Respuestas */}
              {selectedMonitoreo.respuestas?.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.25rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block', color: 'var(--primary)' }}>Respuestas Detalladas</h3>
                  {selectedMonitoreo.respuestas.map((r, idx) => {
                    const newCat = idx === 0 || r.categoria_nombre !== selectedMonitoreo.respuestas[idx - 1].categoria_nombre;
                    return (
                      <div key={r.id_respuesta}>
                        {newCat && <h4 style={{ backgroundColor: 'rgba(37,99,235,0.08)', padding: '0.6rem 1rem', borderRadius: '0.5rem', color: 'var(--primary)', margin: '1.5rem 0 0.75rem', fontSize: '0.85rem', fontWeight: '700' }}>{r.categoria_nombre}</h4>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid var(--border)', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>{r.pregunta}</p>
                            {r.comentario && <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>💬 {r.comentario}</p>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>{r.opcion_nombre || '—'}</p>
                            <p style={{ margin: '0.15rem 0 0', fontWeight: '800', color: 'var(--primary)', fontSize: '0.9rem' }}>{r.puntaje} pts</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Observaciones */}
              <div style={{ marginTop: '2rem', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '0.75rem', display: 'grid', gap: '1.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>Observaciones y Compromisos</h4>
                {[
                  ['OBSERVACIONES GENERALES', selectedMonitoreo.observaciones_generales],
                  ['DESEMPEÑO PRIORIZADO', selectedMonitoreo.desempeno_priorizado],
                  ['COMPROMISO DEL DOCENTE', selectedMonitoreo.compromiso_docente],
                  ['RECOMENDACIONES', selectedMonitoreo.recomendaciones],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: val ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: val ? 'normal' : 'italic' }}>{val || 'No registrado.'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialMonitoreoPage;
