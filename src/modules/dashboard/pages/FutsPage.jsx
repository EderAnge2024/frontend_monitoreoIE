import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { useAuth } from '../../../context/AuthContext';
import { FileText, Download } from 'lucide-react';

const FutsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: true
  });
  const [archivo, setArchivo] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/futs');
      setData(res.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion,
        estado: item.estado
      });
    } else {
      setEditingItem(null);
      setFormData({
        nombre: '',
        descripcion: '',
        estado: true
      });
    }
    setArchivo(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = new FormData();
    dataToSend.append('nombre', formData.nombre);
    dataToSend.append('descripcion', formData.descripcion);
    dataToSend.append('estado', formData.estado);
    if (archivo) {
      dataToSend.append('archivo', archivo);
    }

    try {
      if (editingItem) {
        await api.put(`/futs/${editingItem.id_fut}`, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        if (!archivo) {
          alert("Debe adjuntar un archivo (PDF/DOCX) para el nuevo FUT.");
          return;
        }
        await api.post('/futs', dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving fut:', error);
      alert('Ocurrió un error al guardar el FUT. Verifique que el archivo sea válido (PDF/DOCX) y menor a 5MB.');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Estás seguro de eliminar el FUT: ${item.nombre}?`)) {
      try {
        await api.delete(`/futs/${item.id_fut}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting fut:', error);
      }
    }
  };

  const getFullUrl = (url) => {
    return `http://localhost:5000${url}`; // Adjust as per your env
  };

  const columns = [
    { header: 'Documento FUT', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '8px', 
          backgroundColor: '#f1f5f9', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <FileText size={20} />
        </div>
        <div>
          <div style={{ fontWeight: '600' }}>{row.nombre}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(row.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    )},
    { header: 'Descripción', render: (row) => (
      <div style={{ fontSize: '0.875rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {row.descripcion}
      </div>
    )},
    { header: 'Estado', render: (row) => (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: row.estado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: row.estado ? '#10b981' : '#ef4444'
      }}>
        {row.estado ? 'Activo' : 'Inactivo'}
      </span>
    )},
    { header: 'Archivo', render: (row) => (
      <a 
        href={getFullUrl(row.archivo_url)} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}
      >
        <Download size={16} /> Descargar
      </a>
    )}
  ];

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>FUTs Institucionales-en prueba</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de formatos únicos de trámite para uso docente.</p>
        </div>
      </div>

      <DataTable 
        title="Plantillas Disponibles"
        columns={columns} 
        data={data} 
        onEdit={handleOpenModal} 
        onDelete={handleDelete}
        onCreate={() => handleOpenModal()}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Editar FUT' : 'Nuevo FUT'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Nombre del FUT</label>
            <input 
              type="text" 
              className="input" 
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
              placeholder="Ej. Formato Único de Trámite - Licencia"
            />
          </div>
          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea 
              className="input" 
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              style={{ minHeight: '80px' }}
            />
          </div>
          <div className="form-group">
            <label className="label">Archivo Plantilla (PDF, DOCX) {editingItem && "- Opcional si no desea cambiar"}</label>
            <input 
              type="file" 
              className="input" 
              accept=".pdf,.doc,.docx"
              onChange={(e) => setArchivo(e.target.files[0])}
              style={{ padding: '0.5rem' }}
            />
          </div>
          {editingItem && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.checked})}
                id="estado_fut"
              />
              <label htmlFor="estado_fut" style={{ margin: 0 }}>Plantilla Activa</label>
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Plantilla</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FutsPage;
