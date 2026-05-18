import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  User, 
  FileText, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Save,
  ClipboardList
} from 'lucide-react';

const NuevoMonitoreoPage = () => {
  const [step, setStep] = useState(1);
  const [docentes, setDocentes] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [selectedFichaFull, setSelectedFichaFull] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo_monitoreo: 'Docente',
    id_docente: '',
    id_ficha: '',
    id_periodo: '',
    numero_visita: 1,
    fecha: new Date().toISOString().split('T')[0],
    area: '',
    sesion: '',
    competencia: '',
    desempeno: '',
    compromiso_docente: '',
    observaciones_generales: '',
    recomendaciones: ''
  });

  const [respuestas, setRespuestas] = useState({}); // { id_pregunta: { id_opcion, texto, puntaje } }
  const [evaluadosIds, setEvaluadosIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [niveles, setNiveles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, fichaRes, periodRes, nivelRes] = await Promise.all([
          api.get('/docentes'),
          api.get('/fichas'),
          api.get('/periodos'),
          api.get('/niveles')
        ]);
        setDocentes(docRes.data);
        setFichas(fichaRes.data);
        setPeriodos(periodRes.data);
        setNiveles(nivelRes.data);
        if (periodRes.data.length > 0) {
          setFormData(prev => ({...prev, id_periodo: periodRes.data[0].id_periodo}));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchEvaluados = async () => {
      if (!formData.id_periodo || !formData.id_ficha) {
        setEvaluadosIds([]);
        return;
      }
      try {
        const url = `/monitoreos/evaluados/${formData.id_periodo}?id_ficha=${formData.id_ficha}`;
        const res = await api.get(url);
        setEvaluadosIds(res.data.map(id => parseInt(id)));
      } catch (err) { console.error(err); }
    };
    fetchEvaluados();
  }, [formData.id_periodo, formData.id_ficha]);

  const handleFichaChange = async (fichaId) => {
    setFormData({...formData, id_ficha: fichaId});
    if (!fichaId) {
      setSelectedFichaFull(null);
      return;
    }
    try {
      const res = await api.get(`/fichas/${fichaId}`);
      setSelectedFichaFull(res.data);
      // Initialize responses
      const initialResp = {};
      res.data.categorias.forEach(cat => {
        cat.preguntas.forEach(q => {
          initialResp[q.id_pregunta] = { id_opcion: '', puntaje: 0, comentario: '' };
        });
      });
      setRespuestas(initialResp);
    } catch (err) { console.error(err); }
  };

  const handleAnswerChange = (qId, option) => {
    setRespuestas({
      ...respuestas,
      [qId]: { 
        ...respuestas[qId],
        id_opcion: option.id_opcion, 
        puntaje: parseFloat(option.valor) 
      }
    });
  };

  const handleCommentChange = (qId, text) => {
    setRespuestas({
      ...respuestas,
      [qId]: { 
        ...respuestas[qId],
        comentario: text 
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create Monitoreo
      const monRes = await api.post('/monitoreos', formData);
      const id_monitoreo = monRes.data.id_monitoreo;

      // 2. Save Answers
      const answersArray = Object.keys(respuestas).map(qId => ({
        id_pregunta: qId,
        ...respuestas[qId]
      })).filter(a => a.id_opcion || (a.puntaje !== undefined && a.puntaje !== null)); // Ensure manual scores are included

      await api.post('/monitoreos/respuestas', {
        id_monitoreo,
        respuestas: answersArray
      });

      alert('Monitoreo registrado y evaluado con éxito');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      alert('Error al registrar el monitoreo completo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando datos...</div>;

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nuevo Monitoreo</h1>
        <p style={{ color: 'var(--text-muted)' }}>Registro de visita y acompañamiento pedagógico</p>
      </div>

      {/* Progress Stepper */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', gap: '2rem', position: 'relative' }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: step >= s ? 'var(--primary)' : '#e2e8f0',
              color: step >= s ? 'white' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              transition: 'all 0.3s',
              boxShadow: step === s ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none'
            }}>
              {s}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: step >= s ? 'var(--primary)' : 'var(--text-muted)' }}>
              {s === 1 ? 'Selección' : s === 2 ? 'Sesión' : s === 3 ? 'Evaluación' : 'Finalizar'}
            </span>
          </div>
        ))}
        <div style={{ position: 'absolute', top: '20px', left: '25%', right: '25%', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
      </div>

      <div className="card" style={{ padding: '2.5rem', position: 'relative' }}>
        {/* Helper Header for Steps 2+ */}
        {step > 1 && (
          <div style={{ 
            backgroundColor: 'var(--primary-light)', 
            padding: '1rem 1.5rem', 
            borderRadius: '0.75rem', 
            marginBottom: '2rem',
            border: '1px solid var(--primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>Evaluando a:</p>
              <h4 style={{ margin: 0, color: 'var(--text-main)' }}>
                {docentes.find(d => d.id_docente == formData.id_docente)?.nombres} {docentes.find(d => d.id_docente == formData.id_docente)?.apellidos}
              </h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>Instrumento:</p>
              <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)' }}>
                {fichas.find(f => f.id_ficha == formData.id_ficha)?.nombre}
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={24} color="var(--primary)" /> Selección de Docente e Instrumento
            </h3>
            <div className="form-group">
              <label className="label">Periodo Lectivo</label>
              <select className="input" value={formData.id_periodo} onChange={e => setFormData({...formData, id_periodo: e.target.value})} required>
                <option value="">Seleccionar Periodo</option>
                {periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tipo de Monitoreo</label>
              <select 
                className="input" 
                value={formData.tipo_monitoreo} 
                onChange={e => setFormData({...formData, tipo_monitoreo: e.target.value, id_docente: '', id_ficha: ''})} 
                required
              >
                <option value="Docente">Docente (Ficha Pedagógica)</option>
                <option value="Tutoría">Tutoría</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Ficha de Monitoreo</label>
              <select className="input" value={formData.id_ficha} onChange={e => handleFichaChange(e.target.value)} required>
                <option value="">Seleccionar Instrumento</option>
                {fichas
                  .filter(f => formData.tipo_monitoreo === 'Tutoría' ? f.es_tutoria === true : f.es_tutoria === false)
                  .map(f => <option key={f.id_ficha} value={f.id_ficha}>{f.nombre}</option>)
                }
              </select>
            </div>

            <div className="form-group">
              <label className="label">Docente a Monitorear</label>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Buscar docente por nombre o DNI..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '1rem', 
                maxHeight: '400px', 
                overflowY: 'auto',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--background)'
              }}>
                {docentes
                  .filter(d => formData.tipo_monitoreo === 'Tutoría' ? d.tutor === true : true)
                  .filter(d => {
                    const full = `${d.nombres} ${d.apellidos} ${d.dni}`.toLowerCase();
                    return full.includes(searchTerm.toLowerCase());
                  })
                  .map(d => {
                    const isEvaluated = evaluadosIds.includes(parseInt(d.id_docente));
                    const isSelected = formData.id_docente == d.id_docente;
                    
                    return (
                      <div 
                        key={d.id_docente}
                        onClick={() => !isEvaluated && setFormData({...formData, id_docente: d.id_docente})}
                        style={{ 
                          padding: '1rem', 
                          borderRadius: '0.75rem', 
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                          cursor: isEvaluated ? 'not-allowed' : 'pointer',
                          opacity: isEvaluated ? 0.6 : 1,
                          position: 'relative',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ 
                          width: '44px', height: '44px', borderRadius: '50%', 
                          backgroundColor: isEvaluated ? '#94a3b8' : 'var(--primary)', 
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'
                        }}>
                          {d.nombres.charAt(0)}{d.apellidos.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{d.nombres} {d.apellidos}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {d.tutor && formData.tipo_monitoreo === 'Tutoría' ? `Tutor: ${d.grado_tutoria}` : d.area || 'Sin Área'}
                          </p>
                        </div>
                        {isEvaluated && (
                          <span style={{ 
                            position: 'absolute', top: '0.5rem', right: '0.5rem', 
                            fontSize: '0.6rem', fontWeight: '900', color: 'var(--danger)', 
                            backgroundColor: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px' 
                          }}>
                            CON ESTA FICHA YA EVALUADO
                          </span>
                        )}
                        {isSelected && (
                          <div style={{ color: 'var(--primary)' }}><CheckCircle size={20} /></div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!formData.id_docente || !formData.id_ficha || !formData.id_periodo}>
                Continuar <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={24} color="var(--primary)" /> Datos de la Sesión
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Fecha</label>
                <input type="date" className="input" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Área Curricular</label>
                <input type="text" className="input" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Nombre de la Sesión / Actividad</label>
              <input type="text" className="input" value={formData.sesion} onChange={e => setFormData({...formData, sesion: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="label">Competencia a evaluar</label>
              <textarea className="input" style={{ minHeight: '80px' }} value={formData.competencia} onChange={e => setFormData({...formData, competencia: e.target.value})}></textarea>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}><ArrowLeft size={18} /> Anterior</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Continuar <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ClipboardList size={24} color="var(--primary)" /> Ejecución de la Ficha
            </h3>

            {/* Guía de Niveles de Desempeño */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '0.75rem', 
              padding: '1rem', 
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Guía de Niveles (Puntaje Total)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {niveles.map(n => (
                  <div key={n.id_nivel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{n.nombre}:</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{n.puntaje_minimo} - {n.puntaje_maximo} pts</span>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedFichaFull?.categorias.map((cat, idx) => (
              <div key={cat.id_categoria} style={{ marginBottom: '2.5rem' }}>
                <h4 style={{ 
                  backgroundColor: 'var(--background)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  color: 'var(--primary)',
                  marginBottom: '1.5rem',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}>
                  {idx + 1}. {cat.nombre}
                </h4>
                
                {cat.preguntas.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '1rem' }}>No hay preguntas configuradas en esta dimensión.</p>
                )}
                
                {cat.preguntas.map((q, qIdx) => (
                  <div key={q.id_pregunta} style={{ marginBottom: '2rem', paddingLeft: '1rem' }}>
                    <p style={{ fontWeight: '600', marginBottom: '1rem' }}>{idx + 1}.{qIdx + 1}. {q.pregunta}</p>
                    
                    {q.opciones.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        {q.opciones.map(opt => (
                          <label key={opt.id_opcion} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            padding: '0.75rem', 
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            backgroundColor: respuestas[q.id_pregunta]?.id_opcion === opt.id_opcion ? 'var(--primary-light)' : 'var(--surface)',
                            borderColor: respuestas[q.id_pregunta]?.id_opcion === opt.id_opcion ? 'var(--primary)' : 'var(--border)',
                            transition: 'all 0.2s'
                          }}>
                            <input 
                              type="radio" 
                              name={`q_${q.id_pregunta}`} 
                              checked={respuestas[q.id_pregunta]?.id_opcion === opt.id_opcion}
                              onChange={() => handleAnswerChange(q.id_pregunta, opt)}
                            />
                            <span style={{ fontSize: '0.875rem' }}>{opt.nombre_opcion} ({opt.valor})</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed var(--border)' }}>
                        <label className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Esta pregunta no tiene alternativas. Ingrese el puntaje manualmente:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <input 
                            type="number" 
                            className="input" 
                            style={{ width: '120px' }}
                            placeholder="Puntaje"
                            max={q.puntaje_maximo}
                            min="0"
                            step="0.01"
                            value={respuestas[q.id_pregunta]?.puntaje || ''}
                            onChange={(e) => setRespuestas({
                              ...respuestas,
                              [q.id_pregunta]: { 
                                ...respuestas[q.id_pregunta],
                                id_opcion: null, 
                                puntaje: parseFloat(e.target.value) || 0 
                              }
                            })}
                          />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            / Máx: {q.puntaje_maximo || 'No def.'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem' }}>
                      <textarea 
                        className="input" 
                        placeholder="Agregar comentario u observación para esta pregunta..." 
                        style={{ minHeight: '60px', fontSize: '0.875rem' }}
                        value={respuestas[q.id_pregunta]?.comentario || ''}
                        onChange={(e) => handleCommentChange(q.id_pregunta, e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}><ArrowLeft size={18} /> Anterior</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>Continuar <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={24} color="var(--primary)" /> Observaciones y Compromisos
            </h3>
            <div className="form-group">
              <label className="label">Observaciones Generales</label>
              <textarea className="input" style={{ minHeight: '100px' }} value={formData.observaciones_generales} onChange={e => setFormData({...formData, observaciones_generales: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label className="label">Compromiso del Docente</label>
              <textarea className="input" style={{ minHeight: '100px' }} value={formData.compromiso_docente} onChange={e => setFormData({...formData, compromiso_docente: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label className="label">Recomendaciones del Monitor</label>
              <textarea className="input" style={{ minHeight: '100px' }} value={formData.recomendaciones} onChange={e => setFormData({...formData, recomendaciones: e.target.value})}></textarea>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setStep(3)} disabled={isSubmitting}><ArrowLeft size={18} /> Anterior</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit} 
                style={{ backgroundColor: 'var(--success)', border: 'none', gap: '0.5rem' }}
                disabled={isSubmitting}
              >
                <Save size={18} /> {isSubmitting ? 'Guardando...' : 'Finalizar Registro'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NuevoMonitoreoPage;
