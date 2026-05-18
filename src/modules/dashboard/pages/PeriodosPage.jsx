import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { Calendar, Plus, Save } from 'lucide-react';

const PeriodosPage = () => {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: true
  });

  const fetchPeriodos = async () => {
    try {
      const res = await api.get('/periodos');
      setPeriodos(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPeriodos(); }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nombre: item.nombre,
        fecha_inicio: item.fecha_inicio.split('T')[0],
        fecha_fin: item.fecha_fin.split('T')[0],
        estado: item.estado
      });
    } else {
      setEditingItem(null);
      setFormData({ nombre: '', fecha_inicio: '', fecha_fin: '', estado: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/periodos/${editingItem.id_periodo}`, formData);
      } else {
        await api.post('/periodos', formData);
      }
      setIsModalOpen(false);
      fetchPeriodos();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Estás seguro de eliminar el periodo ${item.nombre}?`)) {
      try {
        await api.delete(`/periodos/${item.id_periodo}`);
        fetchPeriodos();
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando periodos...</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Periodos Lectivos</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gestiona los ciclos o años académicos para el monitoreo.</p>
      </div>

      <DataTable 
        title="Listado de Periodos"
        columns={[
          { header: 'Periodo', render: (row) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={20} color="var(--primary)" />
              <span style={{ fontWeight: '600' }}>{row.nombre}</span>
            </div>
          )},
          { header: 'Inicio', accessor: 'fecha_inicio', render: (row) => new Date(row.fecha_inicio).toLocaleDateString() },
          { header: 'Fin', accessor: 'fecha_fin', render: (row) => new Date(row.fecha_fin).toLocaleDateString() },
          { header: 'Estado', render: (row) => (
            <span style={{ 
              padding: '0.25rem 0.5rem', 
              borderRadius: '9999px', 
              fontSize: '0.75rem', 
              fontWeight: '600',
              backgroundColor: row.estado ? '#dcfce7' : '#fef2f2',
              color: row.estado ? '#166534' : '#991b1b'
            }}>
              {row.estado ? 'Activo' : 'Inactivo'}
            </span>
          )}
        ]}
        data={periodos}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onCreate={() => handleOpenModal()}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Periodo' : 'Nuevo Periodo'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Nombre del Periodo</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej: Periodo 2024" 
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Fecha Inicio</label>
              <input 
                type="date" 
                className="input" 
                value={formData.fecha_inicio}
                onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label className="label">Fecha Fin</label>
              <input 
                type="date" 
                className="input" 
                value={formData.fecha_fin}
                onChange={e => setFormData({...formData, fecha_fin: e.target.value})}
                required 
              />
            </div>
          </div>
          
          {editingItem && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="checkbox" 
                checked={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.checked})}
                id="estado_periodo"
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <label htmlFor="estado_periodo" style={{ margin: 0, fontWeight: '600', cursor: 'pointer' }}>Periodo Activo</label>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', gap: '0.5rem' }}>
            <Save size={18} /> {editingItem ? 'Actualizar Periodo' : 'Guardar Periodo'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default PeriodosPage;
