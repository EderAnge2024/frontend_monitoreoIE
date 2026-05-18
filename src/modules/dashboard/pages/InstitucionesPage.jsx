import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';

const InstitucionesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo_modular: '',
    direccion: '',
    telefono: '',
    correo: '',
    director: '',
    ugel: '',
    dre: ''
  });

  const fetchData = async () => {
    try {
      const response = await api.get('/instituciones');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching instituciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        nombre: '',
        codigo_modular: '',
        direccion: '',
        telefono: '',
        correo: '',
        director: '',
        ugel: '',
        dre: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/instituciones/${editingItem.id_institucion}`, formData);
      } else {
        await api.post('/instituciones', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving institucion:', error);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Estás seguro de eliminar ${item.nombre}?`)) {
      try {
        await api.delete(`/instituciones/${item.id_institucion}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting institucion:', error);
      }
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Código Modular', accessor: 'codigo_modular' },
    { header: 'Director', accessor: 'director' },
    { header: 'Estado', accessor: 'estado', render: (row) => (
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
  ];

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Instituciones</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gestión de instituciones educativas del sistema.</p>
      </div>

      <DataTable 
        title="Listado de Instituciones"
        columns={columns} 
        data={data} 
        onEdit={handleOpenModal} 
        onDelete={handleDelete}
        onCreate={() => handleOpenModal()}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Editar Institución' : 'Nueva Institución'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Nombre de la Institución</label>
            <input 
              type="text" 
              className="input" 
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Código Modular</label>
              <input 
                type="text" 
                className="input" 
                value={formData.codigo_modular}
                onChange={(e) => setFormData({...formData, codigo_modular: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Teléfono</label>
              <input 
                type="text" 
                className="input" 
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Correo Electrónico</label>
              <input 
                type="email" 
                className="input" 
                value={formData.correo}
                onChange={(e) => setFormData({...formData, correo: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Director</label>
              <input 
                type="text" 
                className="input" 
                value={formData.director}
                onChange={(e) => setFormData({...formData, director: e.target.value})}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">UGEL</label>
              <input 
                type="text" 
                className="input" 
                value={formData.ugel}
                onChange={(e) => setFormData({...formData, ugel: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">DRE</label>
              <input 
                type="text" 
                className="input" 
                value={formData.dre}
                onChange={(e) => setFormData({...formData, dre: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Dirección</label>
            <textarea 
              className="input" 
              style={{ minHeight: '80px' }}
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
            ></textarea>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InstitucionesPage;
