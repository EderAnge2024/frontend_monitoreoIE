import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { useAuth } from '../../../context/AuthContext';
import { UserSquare, BookOpen, GraduationCap, MapPin } from 'lucide-react';

const DocentesPage = () => {
  const [data, setData] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    nivel: '',
    grado: '',
    seccion: '',
    area: '',
    cargo: '',
    condicion_laboral: '',
    id_institucion: user?.id_institucion || '',
    estado: true,
    tutor: false,
    grado_tutoria: '',
    correo: ''
  });

  const fetchData = async () => {
    try {
      const [docRes, instRes] = await Promise.all([
        api.get('/docentes'),
        api.get('/instituciones')
      ]);
      setData(docRes.data);
      setInstituciones(instRes.data);
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
        ...item,
        id_institucion: item.id_institucion || '',
        estado: item.estado !== undefined ? item.estado : true,
        correo: item.correo || item.usuario_correo || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        dni: '',
        nombres: '',
        apellidos: '',
        nivel: '',
        grado: '',
        seccion: '',
        area: '',
        cargo: '',
        condicion_laboral: '',
        id_institucion: user?.id_institucion || '',
        estado: true,
        tutor: false,
        grado_tutoria: '',
        correo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/docentes/${editingItem.id_docente}`, formData);
      } else {
        await api.post('/docentes', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving docente:', error);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${item.nombres}?`)) {
      try {
        await api.delete(`/docentes/${item.id_docente}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting docente:', error);
      }
    }
  };

  const handleResetPassword = async (item) => {
    if (!item.id_usuario) {
      alert('Este docente no tiene una cuenta de usuario vinculada.');
      return;
    }
    const newPass = window.prompt(`Ingresa la nueva contraseña para ${item.nombres} (Déjalo en blanco para usar su DNI: ${item.dni}):`, item.dni);
    if (newPass !== null) {
      try {
        await api.put(`/usuarios/${item.id_usuario}/reset-password`, { newPassword: newPass || item.dni });
        alert('Contraseña restablecida con éxito');
      } catch (error) {
        alert('Error al restablecer contraseña');
      }
    }
  };

  const columns = [
    { header: 'Docente', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          backgroundColor: '#f1f5f9', 
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UserSquare size={20} />
        </div>
        <div>
          <div style={{ fontWeight: '600' }}>{row.nombres} {row.apellidos}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.dni}</div>
        </div>
      </div>
    )},
    { header: 'Especialidad / Área', render: (row) => (
      <div>
        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{row.area}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.nivel} - {row.cargo}</div>
      </div>
    )},
    { header: 'Grado/Secc', render: (row) => (
      <div style={{ fontSize: '0.875rem' }}>
        {row.grado} "{row.seccion}"
      </div>
    )},
    { header: 'Condición', accessor: 'condicion_laboral' },
    { header: 'Estado', render: (row) => (
      <span style={{ 
        padding: '0.25rem 0.5rem', 
        borderRadius: '9999px', 
        fontSize: '0.75rem', 
        fontWeight: '600',
        backgroundColor: row.estado ? '#dcfce7' : '#fef2f2',
        color: row.estado ? '#166534' : '#991b1b'
      }}>
        {row.estado ? 'Activo' : 'Cesado'}
      </span>
    )},
    { header: 'Acciones', render: (row) => (
      <button 
        className="btn btn-sm btn-outline" 
        onClick={() => handleResetPassword(row)}
        style={{ color: 'var(--warning)', borderColor: 'var(--warning)', fontSize: '0.7rem' }}
      >
        Reset Pass
      </button>
    )}
  ];

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Plana Docente</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de docentes para monitoreo y seguimiento.</p>
        </div>
      </div>

      <DataTable 
        title={user?.role === 'director' ? 'Mis Docentes' : 'Todos los Docentes'}
        columns={columns} 
        data={data} 
        onEdit={handleOpenModal} 
        onDelete={handleDelete}
        onCreate={() => handleOpenModal()}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Editar Docente' : 'Nuevo Docente'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">DNI</label>
              <input 
                type="text" 
                className="input" 
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Correo Institucional / Personal</label>
              <input 
                type="email" 
                className="input" 
                placeholder="docente@ejemplo.com"
                value={formData.correo}
                onChange={(e) => setFormData({...formData, correo: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {user?.role === 'administrador' && (
              <div className="form-group">
                <label className="label">Institución</label>
                <select 
                  className="input" 
                  value={formData.id_institucion}
                  onChange={(e) => setFormData({...formData, id_institucion: e.target.value})}
                  required
                >
                  <option value="">Seleccionar IE</option>
                  {instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Nombres</label>
              <input 
                type="text" 
                className="input" 
                value={formData.nombres}
                onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Apellidos</label>
              <input 
                type="text" 
                className="input" 
                value={formData.apellidos}
                onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Área Curricular</label>
              <input 
                type="text" 
                className="input" 
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Nivel Educativo</label>
              <select 
                className="input" 
                value={formData.nivel}
                onChange={(e) => setFormData({...formData, nivel: e.target.value})}
              >
                <option value="">Seleccionar Nivel</option>
                <option value="Inicial">Inicial</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Grado</label>
              <input 
                type="text" 
                className="input" 
                value={formData.grado}
                onChange={(e) => setFormData({...formData, grado: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Sección</label>
              <input 
                type="text" 
                className="input" 
                value={formData.seccion}
                onChange={(e) => setFormData({...formData, seccion: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Cargo</label>
              <input 
                type="text" 
                className="input" 
                value={formData.cargo}
                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Condición Laboral</label>
              <select 
                className="input" 
                value={formData.condicion_laboral}
                onChange={(e) => setFormData({...formData, condicion_laboral: e.target.value})}
              >
                <option value="">Seleccionar Condición</option>
                <option value="Nombrado">Nombrado</option>
                <option value="Contratado">Contratado</option>
              </select>
            </div>
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              <input 
                type="checkbox" 
                checked={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.checked})}
                id="estado_docente"
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <label htmlFor="estado_docente" style={{ margin: 0, fontWeight: '600', cursor: 'pointer' }}>Docente Activo</label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={formData.tutor}
                onChange={(e) => setFormData({...formData, tutor: e.target.checked})}
                id="tutor"
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <label htmlFor="tutor" style={{ margin: 0, fontWeight: '600', cursor: 'pointer' }}>¿Es docente tutor?</label>
            </div>
            
            {formData.tutor && (
              <div className="form-group">
                <label className="label">Grado de tutoría</label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.grado_tutoria || ''}
                  onChange={(e) => setFormData({...formData, grado_tutoria: e.target.value})}
                  required={formData.tutor}
                  placeholder="Ej. 1ro Secundaria"
                />
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Docente</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocentesPage;
