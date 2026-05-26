import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import Modal from '../../../components/common/Modal';
import { Target, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const PRESET_COLORS = [
  '#ef4444', // rojo - Insatisfactorio
  '#f59e0b', // amarillo - En proceso
  '#3b82f6', // azul - Satisfactorio
  '#10b981', // verde - Destacado
  '#8b5cf6', // morado
  '#06b6d4', // cian
];

const DEFAULT_PRESETS = [
  { nombre: 'Insatisfactorio', puntaje_minimo: 0, puntaje_maximo: 49, descripcion: 'El docente no alcanza los criterios básicos de desempeño.', color: '#ef4444' },
  { nombre: 'En Proceso', puntaje_minimo: 50, puntaje_maximo: 69, descripcion: 'El docente está desarrollando las competencias pero aún necesita acompañamiento.', color: '#f59e0b' },
  { nombre: 'Satisfactorio', puntaje_minimo: 70, puntaje_maximo: 89, descripcion: 'El docente cumple con los estándares de desempeño esperados.', color: '#3b82f6' },
  { nombre: 'Destacado', puntaje_minimo: 90, puntaje_maximo: 100, descripcion: 'El docente supera los estándares y sirve como referente pedagógico.', color: '#10b981' },
];

const emptyForm = { nombre: '', puntaje_minimo: '', puntaje_maximo: '', descripcion: '', color: '#6366f1' };

const NivelesDesempenoPage = () => {
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchNiveles = async () => {
    try {
      const res = await api.get('/niveles');
      setNiveles(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNiveles(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (nivel) => {
    setEditing(nivel);
    setForm({
      nombre: nivel.nombre,
      puntaje_minimo: nivel.puntaje_minimo,
      puntaje_maximo: nivel.puntaje_maximo,
      descripcion: nivel.descripcion || '',
      color: nivel.color || '#6366f1',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.nombre || form.puntaje_minimo === '' || form.puntaje_maximo === '') {
      return setError('Nombre, puntaje mínimo y máximo son obligatorios.');
    }
    if (Number(form.puntaje_minimo) >= Number(form.puntaje_maximo)) {
      return setError('El puntaje mínimo debe ser menor que el máximo.');
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/niveles/${editing.id_nivel}`, form);
      } else {
        await api.post('/niveles', form);
      }
      setModalOpen(false);
      fetchNiveles();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/niveles/${deleteModal.id_nivel}`);
      setDeleteModal(null);
      fetchNiveles();
    } catch (e) {
      console.error(e);
    }
  };

  const loadPresets = async () => {
    setSaving(true);
    try {
      for (const preset of DEFAULT_PRESETS) {
        await api.post('/niveles', preset);
      }
      fetchNiveles();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Check for coverage gaps/overlaps
  const sorted = [...niveles].sort((a, b) => a.puntaje_minimo - b.puntaje_minimo);
  const hasGap = sorted.some((n, i) => i > 0 && Number(n.puntaje_minimo) > Number(sorted[i - 1].puntaje_maximo));
  const hasOverlap = sorted.some((n, i) => i > 0 && Number(n.puntaje_minimo) <= Number(sorted[i - 1].puntaje_maximo));

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando niveles...</div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={28} color="var(--primary)" /> Niveles de Desempeño
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Define los rangos de puntaje que determinan el nivel de desempeño docente automáticamente.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {niveles.length === 0 && (
            <button
              className="btn btn-outline"
              onClick={loadPresets}
              disabled={saving}
              style={{ gap: '0.5rem' }}
            >
              Cargar Presets MINEDU
            </button>
          )}
          <button className="btn btn-primary" onClick={openCreate} style={{ gap: '0.5rem' }}>
            <Plus size={18} /> Nuevo Nivel
          </button>
        </div>
      </div>

      {/* Alerts */}
      {hasOverlap && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>⚠ Hay rangos de puntaje que se superponen. Esto puede causar asignaciones de nivel incorrectas.</span>
        </div>
      )}
      {hasGap && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)' }}>
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>⚠ Hay brechas entre rangos. Algunos puntajes no tendrán nivel asignado.</span>
        </div>
      )}

      {/* Scale visualization */}
      {niveles.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '1rem' }}>Escala Visual de Puntajes</h3>
          <div style={{ display: 'flex', height: '40px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {sorted.map((n) => {
              const width = ((n.puntaje_maximo - n.puntaje_minimo) / 100) * 100;
              return (
                <div
                  key={n.id_nivel}
                  style={{
                    width: `${width}%`,
                    backgroundColor: n.color || '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    minWidth: '40px',
                  }}
                  title={`${n.nombre}: ${n.puntaje_minimo} - ${n.puntaje_maximo}`}
                >
                  {n.nombre}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      )}

      {/* Niveles Grid */}
      {niveles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Target size={56} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No hay niveles configurados</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Carga los presets estándar del MINEDU o crea tus propios niveles personalizados.
          </p>
          <button className="btn btn-primary" onClick={loadPresets} disabled={saving}>
            {saving ? 'Cargando...' : 'Cargar Presets MINEDU'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {sorted.map((n) => (
            <div key={n.id_nivel} className="card" style={{ borderLeft: `5px solid ${n.color || '#6366f1'}`, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: n.color || '#6366f1', flexShrink: 0 }} />
                  <h3 style={{ fontWeight: '800', fontSize: '1.125rem', color: 'var(--text-main)' }}>{n.nombre}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(n)} style={{ padding: '0.4rem', borderRadius: '0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteModal(n)} style={{ padding: '0.4rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: n.color || '#6366f1' }}>{n.puntaje_minimo}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '1.25rem' }}>—</span>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: n.color || '#6366f1' }}>{n.puntaje_maximo}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '0.25rem' }}>pts</span>
              </div>

              {n.descripcion && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{n.descripcion}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Nivel de Desempeño' : 'Nuevo Nivel de Desempeño'}
      >
        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="label">Nombre del nivel *</label>
          <input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Destacado, Satisfactorio..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Puntaje mínimo *</label>
            <input className="input" type="number" min="0" max="100" value={form.puntaje_minimo} onChange={e => setForm({ ...form, puntaje_minimo: e.target.value })} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="label">Puntaje máximo *</label>
            <input className="input" type="number" min="0" max="100" value={form.puntaje_maximo} onChange={e => setForm({ ...form, puntaje_maximo: e.target.value })} placeholder="100" />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Descripción (opcional)</label>
          <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción breve de lo que implica este nivel..." />
        </div>

        <div className="form-group">
          <label className="label">Color identificador</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c, border: form.color === c ? '3px solid var(--text-main)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} title={c} />
            ))}
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: '40px', height: '32px', borderRadius: '0.5rem', border: '1px solid var(--border)', cursor: 'pointer', padding: '2px' }} title="Color personalizado" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : editing ? 'Actualizar Nivel' : 'Crear Nivel'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar Nivel">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          ¿Estás seguro de eliminar el nivel <strong style={{ color: 'var(--text-main)' }}>{deleteModal?.nombre}</strong>?
          Los monitoreos ya evaluados con este nivel <strong>no serán afectados</strong>, pero los nuevos no podrán asignarse a él.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>Cancelar</button>
          <button className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white' }} onClick={handleDelete}>Sí, eliminar</button>
        </div>
      </Modal>
    </div>
  );
};

export default NivelesDesempenoPage;
