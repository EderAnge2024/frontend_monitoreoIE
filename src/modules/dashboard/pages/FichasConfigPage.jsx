import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { 
  FileText, 
  Layers, 
  HelpCircle, 
  ListOrdered, 
  ChevronRight, 
  Plus, 
  ArrowLeft,
  Settings2,
  Edit,
  Trash2
} from 'lucide-react';

const FichasConfigPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fichas, setFichas] = useState([]);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [niveles, setNiveles] = useState([]);
  
  // Modals
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);

  const [fichaForm, setFichaForm] = useState({ nombre: '', descripcion: '', estado: true, es_tutoria: false });
  const [categoryForm, setCategoryForm] = useState({ nombre: '', descripcion: '', orden: 0 });
  const [questionForm, setQuestionForm] = useState({ 
    pregunta: '', 
    tipo_respuesta: 'seleccion_unica', 
    puntaje_maximo: 0, 
    peso: 0, 
    obligatorio: true,
    orden: 0 
  });
  const [optionForm, setOptionForm] = useState({ nombre_opcion: '', valor: 0, orden: 0 });

  const isAdmin = user?.role === 'administrador';

  const fetchFichas = async () => {
    try {
      const [fRes, nRes] = await Promise.all([
        api.get('/fichas'),
        api.get('/niveles')
      ]);
      setFichas(fRes.data);
      setNiveles(nRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCategories = async (fichaId) => {
    try {
      const res = await api.get(`/fichas/${fichaId}/categorias`);
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchQuestions = async (catId) => {
    try {
      const res = await api.get(`/fichas/categorias/${catId}/preguntas`);
      setQuestions(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchOptions = async (qId) => {
    try {
      const res = await api.get(`/fichas/preguntas/${qId}/opciones`);
      setOptions(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchFichas(); }, []);

  // --- Handlers ---
  const handleFichaSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/fichas/${editingItem.id_ficha}`, fichaForm);
      } else {
        await api.post('/fichas', fichaForm);
      }
      setIsFichaModalOpen(false);
      setEditingItem(null);
      fetchFichas();
    } catch (err) { console.error(err); }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/fichas/categorias/${editingItem.id_categoria}`, categoryForm);
      } else {
        await api.post('/fichas/categorias', { ...categoryForm, id_ficha: selectedFicha.id_ficha });
      }
      setIsCategoryModalOpen(false);
      setEditingItem(null);
      fetchCategories(selectedFicha.id_ficha);
    } catch (err) { console.error(err); }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/fichas/preguntas/${editingItem.id_pregunta}`, questionForm);
      } else {
        await api.post('/fichas/preguntas', { ...questionForm, id_categoria: selectedCategory.id_categoria });
      }
      setIsQuestionModalOpen(false);
      setEditingItem(null);
      fetchQuestions(selectedCategory.id_categoria);
    } catch (err) { console.error(err); }
  };

  const handleOptionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/fichas/opciones/${editingItem.id_opcion}`, optionForm);
      } else {
        await api.post('/fichas/opciones', { ...optionForm, id_pregunta: selectedQuestion.id_pregunta });
      }
      setIsOptionModalOpen(false);
      setEditingItem(null);
      fetchOptions(selectedQuestion.id_pregunta);
    } catch (err) { console.error(err); }
  };

  // --- Delete Handlers ---
  const handleDeleteFicha = async (ficha) => {
    if (window.confirm('¿Eliminar ficha y todo su contenido?')) {
      try {
        await api.delete(`/fichas/${ficha.id_ficha}`);
        fetchFichas();
      } catch (err) { console.error(err); }
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm('¿Eliminar categoría y sus preguntas?')) {
      try {
        await api.delete(`/fichas/categorias/${cat.id_categoria}`);
        fetchCategories(selectedFicha.id_ficha);
      } catch (err) { console.error(err); }
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (window.confirm('¿Eliminar esta pregunta?')) {
      try {
        await api.delete(`/fichas/preguntas/${q.id_pregunta}`);
        fetchQuestions(selectedCategory.id_categoria);
      } catch (err) { console.error(err); }
    }
  };

  const handleDeleteOption = async (opt) => {
    if (window.confirm('¿Eliminar esta opción?')) {
      try {
        await api.delete(`/fichas/opciones/${opt.id_opcion}`);
        fetchOptions(selectedQuestion.id_pregunta);
      } catch (err) { console.error(err); }
    }
  };

  const selectFicha = (ficha) => {
    setSelectedFicha(ficha);
    setSelectedCategory(null);
    setSelectedQuestion(null);
    fetchCategories(ficha.id_ficha);
  };

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedQuestion(null);
    fetchQuestions(cat.id_categoria);
  };

  const selectQuestion = (q) => {
    setSelectedQuestion(q);
    fetchOptions(q.id_pregunta);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando configuración...</div>;

  return (
    <div className="fade-in">
      {/* Breadcrumbs / Navigation */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <button onClick={() => { setSelectedFicha(null); setSelectedCategory(null); setSelectedQuestion(null); }} style={{ color: !selectedFicha ? 'var(--text-main)' : 'var(--primary)', fontWeight: !selectedFicha ? '700' : '500', background: 'none' }}>Fichas</button>
        {selectedFicha && (
          <>
            <ChevronRight size={14} />
            <button onClick={() => { setSelectedCategory(null); setSelectedQuestion(null); }} style={{ color: !selectedCategory ? 'var(--text-main)' : 'var(--primary)', fontWeight: !selectedCategory ? '700' : '500', background: 'none' }}>{selectedFicha.nombre}</button>
          </>
        )}
        {selectedCategory && (
          <>
            <ChevronRight size={14} />
            <button onClick={() => setSelectedQuestion(null)} style={{ color: !selectedQuestion ? 'var(--text-main)' : 'var(--primary)', fontWeight: !selectedQuestion ? '700' : '500', background: 'none' }}>{selectedCategory.nombre}</button>
          </>
        )}
        {selectedQuestion && (
          <>
            <ChevronRight size={14} />
            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Opciones</span>
          </>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Configuración de Fichas
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Diseña y estructura tus instrumentos de monitoreo.</p>
      </div>

      {/* Guía de Niveles de Desempeño */}
      <div style={{ 
        backgroundColor: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '0.75rem', 
        padding: '1.25rem', 
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          💡 Referencia: Niveles de Desempeño Configuradoss
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          {niveles.map(n => (
            <div key={n.id_nivel} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>{n.nombre}:</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{n.puntaje_minimo} - {n.puntaje_maximo} pts</span>
            </div>
          ))}
          {niveles.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No hay niveles configurados aún.</p>}
        </div>
      </div>

      {!selectedFicha ? (
        <DataTable 
          title="Instrumentos Disponibles"
          columns={[
            { header: 'Instrumento', render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: '600' }}>{row.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.descripcion}</div>
                </div>
              </div>
            )},
            { header: 'Uso', render: (row) => row.es_tutoria ? 'Tutoría' : 'Pedagógico' },
            { header: 'Estado', render: (row) => (
               <span style={{ color: row.estado ? 'var(--success)' : 'var(--error)', fontWeight: '600' }}>
                 {row.estado ? 'Activo' : 'Inactivo'}
               </span>
            )},
            { header: 'Acciones', render: (row) => (
              <button className="btn btn-sm btn-outline" onClick={() => selectFicha(row)}>
                <Settings2 size={14} style={{ marginRight: '4px' }} /> Configurar
              </button>
            )}
          ]}
          data={fichas}
          onEdit={isAdmin ? (row) => { setEditingItem(row); setFichaForm(row); setIsFichaModalOpen(true); } : null}
          onDelete={isAdmin ? handleDeleteFicha : null}
          onCreate={isAdmin ? () => { setEditingItem(null); setFichaForm({ nombre: '', descripcion: '', estado: true, es_tutoria: false }); setIsFichaModalOpen(true); } : null}
        />
      ) : !selectedCategory ? (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setSelectedFicha(null)} style={{ gap: '0.5rem' }}>
              <ArrowLeft size={18} /> Volver a Fichas
            </button>
          </div>
          <DataTable 
            title={`Dimensiones / Categorías: ${selectedFicha.nombre}`}
            columns={[
              { header: 'Orden', accessor: 'orden' },
              { header: 'Categoría', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Layers size={20} color="var(--success)" />
                  <div>
                    <div style={{ fontWeight: '600' }}>{row.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.descripcion}</div>
                  </div>
                </div>
              )},
              { header: 'Acciones', render: (row) => (
                <button className="btn btn-sm btn-outline" onClick={() => selectCategory(row)}>
                  <ChevronRight size={14} style={{ marginRight: '4px' }} /> Preguntas
                </button>
              )}
            ]}
            data={categories}
            onEdit={isAdmin ? (row) => { setEditingItem(row); setCategoryForm(row); setIsCategoryModalOpen(true); } : null}
            onDelete={isAdmin ? handleDeleteCategory : null}
            onCreate={isAdmin ? () => { setEditingItem(null); setCategoryForm({ nombre: '', descripcion: '', orden: categories.length + 1 }); setIsCategoryModalOpen(true); } : null}
          />
        </div>
      ) : !selectedQuestion ? (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setSelectedCategory(null)} style={{ gap: '0.5rem' }}>
              <ArrowLeft size={18} /> Volver a Categorías
            </button>
          </div>
          <DataTable 
            title={`Preguntas en: ${selectedCategory.nombre}`}
            columns={[
              { header: 'Orden', accessor: 'orden' },
              { header: 'Pregunta', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <HelpCircle size={20} color="var(--warning)" />
                  <div style={{ fontWeight: '500' }}>{row.pregunta}</div>
                </div>
              )},
              { header: 'Tipo', accessor: 'tipo_respuesta' },
              { header: 'Puntaje Máx', accessor: 'puntaje_maximo' },
              { header: 'Acciones', render: (row) => (
                <button className="btn btn-sm btn-outline" onClick={() => selectQuestion(row)}>
                  <ListOrdered size={14} style={{ marginRight: '4px' }} /> Opciones
                </button>
              )}
            ]}
            data={questions}
            onEdit={isAdmin ? (row) => { setEditingItem(row); setQuestionForm(row); setIsQuestionModalOpen(true); } : null}
            onDelete={isAdmin ? handleDeleteQuestion : null}
            onCreate={isAdmin ? () => { setEditingItem(null); setQuestionForm({ pregunta: '', tipo_respuesta: 'seleccion_unica', puntaje_maximo: 0, peso: 0, obligatorio: true, orden: questions.length + 1 }); setIsQuestionModalOpen(true); } : null}
          />
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setSelectedQuestion(null)} style={{ gap: '0.5rem' }}>
              <ArrowLeft size={18} /> Volver a Preguntas
            </button>
          </div>
          <DataTable 
            title={`Opciones para: ${selectedQuestion.pregunta}`}
            columns={[
              { header: 'Orden', accessor: 'orden' },
              { header: 'Opción', accessor: 'nombre_opcion' },
              { header: 'Valor (Puntaje)', accessor: 'valor' }
            ]}
            data={options}
            onEdit={isAdmin ? (row) => { setEditingItem(row); setOptionForm(row); setIsOptionModalOpen(true); } : null}
            onDelete={isAdmin ? handleDeleteOption : null}
            onCreate={isAdmin ? () => { setEditingItem(null); setOptionForm({ nombre_opcion: '', valor: 0, orden: options.length + 1 }); setIsOptionModalOpen(true); } : null}
          />
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isFichaModalOpen} onClose={() => setIsFichaModalOpen(false)} title={editingItem ? "Editar Ficha" : "Nueva Ficha"}>
        <form onSubmit={handleFichaSubmit}>
          <div className="form-group">
            <label className="label">Nombre del Instrumento</label>
            <input type="text" className="input" value={fichaForm.nombre} onChange={e => setFichaForm({...fichaForm, nombre: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea className="input" value={fichaForm.descripcion} onChange={e => setFichaForm({...fichaForm, descripcion: e.target.value})}></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={fichaForm.es_tutoria} onChange={e => setFichaForm({...fichaForm, es_tutoria: e.target.checked})} id="es_tutoria" />
              <label htmlFor="es_tutoria" style={{ margin: 0, fontWeight: '600' }}>Exclusivo para Tutoría</label>
            </div>
            {editingItem && (
               <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={fichaForm.estado} onChange={e => setFichaForm({...fichaForm, estado: e.target.checked})} id="estado_f" />
                  <label htmlFor="estado_f" style={{ margin: 0 }}>Instrumento Activo</label>
               </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>{editingItem ? 'Actualizar' : 'Crear'} Ficha</button>
        </form>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingItem ? "Editar Categoría" : "Nueva Categoría"}>
        <form onSubmit={handleCategorySubmit}>
          <div className="form-group">
            <label className="label">Nombre de la Categoría</label>
            <input type="text" className="input" value={categoryForm.nombre} onChange={e => setCategoryForm({...categoryForm, nombre: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea className="input" value={categoryForm.descripcion} onChange={e => setCategoryForm({...categoryForm, descripcion: e.target.value})}></textarea>
          </div>
          <div className="form-group">
            <label className="label">Orden</label>
            <input type="number" className="input" value={categoryForm.orden} onChange={e => setCategoryForm({...categoryForm, orden: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editingItem ? 'Actualizar' : 'Añadir'} Categoría</button>
        </form>
      </Modal>

      <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} title={editingItem ? "Editar Pregunta" : "Nueva Pregunta"}>
        <form onSubmit={handleQuestionSubmit}>
          <div className="form-group">
            <label className="label">Enunciado de la Pregunta</label>
            <textarea className="input" value={questionForm.pregunta} onChange={e => setQuestionForm({...questionForm, pregunta: e.target.value})} required></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Tipo de Respuesta</label>
              <select className="input" value={questionForm.tipo_respuesta} onChange={e => setQuestionForm({...questionForm, tipo_respuesta: e.target.value})}>
                <option value="seleccion_unica">Selección Única</option>
                <option value="seleccion_multiple">Selección Múltiple</option>
                <option value="texto">Texto Libre</option>
                <option value="numero">Numérico</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Puntaje Máximo</label>
              <input type="number" className="input" value={questionForm.puntaje_maximo} onChange={e => setQuestionForm({...questionForm, puntaje_maximo: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">¿Es Obligatoria?</label>
              <select className="input" value={questionForm.obligatorio} onChange={e => setQuestionForm({...questionForm, obligatorio: e.target.value === 'true'})}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Orden</label>
              <input type="number" className="input" value={questionForm.orden} onChange={e => setQuestionForm({...questionForm, orden: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editingItem ? 'Actualizar' : 'Guardar'} Pregunta</button>
        </form>
      </Modal>

      <Modal isOpen={isOptionModalOpen} onClose={() => setIsOptionModalOpen(false)} title={editingItem ? "Editar Opción" : "Nueva Opción de Respuesta"}>
        <form onSubmit={handleOptionSubmit}>

          {/* Preset selector */}
          {!editingItem && (
            <div className="form-group">
              <label className="label">Tipo de Opción</label>
              <select
                className="input"
                defaultValue=""
                onChange={e => {
                  const val = e.target.value;
                  if (!val) return;
                  const presets = {
                    'I':  { nombre_opcion: 'NIVEL I',  valor: 1 },
                    'II': { nombre_opcion: 'NIVEL II', valor: 2 },
                    'III':{ nombre_opcion: 'NIVEL III',valor: 3 },
                    'IV': { nombre_opcion: 'NIVEL IV', valor: 4 },
                    'SI': { nombre_opcion: 'SI',       valor: 0 },
                    'NO': { nombre_opcion: 'NO',       valor: 0 },
                  };
                  if (presets[val]) setOptionForm(f => ({ ...f, ...presets[val] }));
                }}
              >
                <option value="">— Seleccionar tipo —</option>
                <optgroup label="Niveles de desempeño">
                  <option value="I">Nivel I (1 punto)</option>
                  <option value="II">Nivel II (2 puntos)</option>
                  <option value="III">Nivel III (3 puntos)</option>
                  <option value="IV">Nivel IV (4 puntos)</option>
                </optgroup>
                <optgroup label="Sí / No (0 puntos — solo visible)">
                  <option value="SI">SÍ</option>
                  <option value="NO">NO</option>
                </optgroup>
              </select>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                Seleccionar rellena automáticamente los campos. Puedes editarlos si lo necesitas.
              </p>
            </div>
          )}

          <div className="form-group">
            <label className="label">Texto de la Opción</label>
            <input type="text" className="input" value={optionForm.nombre_opcion}
              onChange={e => setOptionForm({...optionForm, nombre_opcion: e.target.value})}
              required placeholder="Ej: NIVEL I, NIVEL II, SI, NO..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Valor (Puntaje)</label>
              <input type="number" step="0.01" min="0" className="input" value={optionForm.valor}
                onChange={e => setOptionForm({...optionForm, valor: e.target.value})} required />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
                SI / NO deben ser 0 para no sumar puntos.
              </p>
            </div>
            <div className="form-group">
              <label className="label">Orden</label>
              <input type="number" className="input" value={optionForm.orden}
                onChange={e => setOptionForm({...optionForm, orden: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {editingItem ? 'Actualizar' : 'Añadir'} Opción
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FichasConfigPage;
