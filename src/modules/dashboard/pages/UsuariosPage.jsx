import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { User, Mail, Phone, Shield, Building } from 'lucide-react';

const UsuariosPage = () => {
  const [data, setData] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    password: '',
    telefono: '',
    id_institucion: '',
    id_rol: ''
  });

  const fetchData = async () => {
    try {
      const [usersRes, instRes, rolesRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/instituciones'),
        api.get('/roles')
      ]);
      setData(usersRes.data);
      setInstituciones(instRes.data);
      setRoles(rolesRes.data);
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
        password: '' // Don't show password
      });
    } else {
      setEditingItem(null);
      setFormData({
        dni: '',
        nombres: '',
        apellidos: '',
        correo: '',
        password: '',
        telefono: '',
        id_institucion: '',
        id_rol: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/usuarios/${editingItem.id_usuario}`, formData);
      } else {
        await api.post('/usuarios', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${item.nombres}?`)) {
      try {
        await api.delete(`/usuarios/${item.id_usuario}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleResetPassword = async (item) => {
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
    {
      header: 'Usuario', render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            {row.nombres.charAt(0)}{row.apellidos.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: '600' }}>{row.nombres} {row.apellidos}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.dni}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Contacto', render: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
            <Mail size={14} color="var(--text-muted)" /> {row.correo}
          </div>
          {row.telefono && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
              <Phone size={14} color="var(--text-muted)" /> {row.telefono}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Rol', render: (row) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: '#f1f5f9',
          color: 'var(--text-main)',
          textTransform: 'capitalize'
        }}>
          <Shield size={12} /> {row.role}
        </span>
      )
    },
    {
      header: 'Estado', render: (row) => (
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
      )
    },
    {
      header: 'Acciones', render: (row) => (
        <button
          className="btn btn-sm btn-outline"
          onClick={() => handleResetPassword(row)}
          style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
        >
          <Shield size={12} style={{ marginRight: '4px' }} /> Reset Pass
        </button>
      )
    }
  ];

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando usuarios...</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Gestión de Usuarios</h1>
        <p style={{ color: 'var(--text-muted)' }}>Administra los accesos y roles del sistema.</p>
      </div>

      <DataTable
        title="Todos los Usuarios (Admin, Directores, Docentes)"
        columns={columns}
        data={data}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onCreate={() => handleOpenModal()}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">DNI</label>
              <input
                type="text"
                className="input"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Rol en el Sistema</label>
              <select
                className="input"
                value={formData.id_rol}
                onChange={(e) => setFormData({ ...formData, id_rol: e.target.value })}
                required
              >
                <option value="">Seleccionar Rol</option>
                {roles
                  .filter(r => r.nombre.toLowerCase() !== 'docente')
                  .map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)
                }
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Nombres</label>
              <input
                type="text"
                className="input"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Apellidos</label>
              <input
                type="text"
                className="input"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Correo Electrónico</label>
            <input
              type="email"
              className="input"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              required
            />
          </div>

          {!editingItem && (
            <div className="form-group">
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Teléfono</label>
              <input
                type="text"
                className="input"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Institución</label>
              <select
                className="input"
                value={formData.id_institucion}
                onChange={(e) => setFormData({ ...formData, id_institucion: e.target.value })}
              >
                <option value="">Ninguna / Global</option>
                {instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Usuario</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsuariosPage;
