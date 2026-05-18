import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { useAuth } from '../../../context/AuthContext';
import { ClipboardList, Download, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const SolicitudesPage = () => {
  const [data, setData] = useState([]);
  const [futs, setFuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    id_fut: '',
    tipo_solicitud: 'Licencia',
    asunto: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [archivo, setArchivo] = useState(null);

  const [statusData, setStatusData] = useState({
    estado: 'Pendiente',
    observacion: ''
  });

  const fetchData = async () => {
    try {
      if (user.role === 'docente') {
        const [solRes, futsRes] = await Promise.all([
          api.get(`/solicitudes/docente/${user.id_docente}`),
          api.get('/futs/actives')
        ]);
        setData(solRes.data);
        setFuts(futsRes.data);
      } else {
        const res = await api.get('/solicitudes');
        setData(res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user data is fully loaded and we have id_docente if role is docente
    if (user && (user.role !== 'docente' || user.id_docente)) {
      fetchData();
    } else if (user && user.role === 'docente' && !user.id_docente) {
        // Find docente id by dni
        api.get('/docentes').then(res => {
            const doc = res.data.find(d => d.dni === user.dni);
            if (doc) {
                user.id_docente = doc.id_docente;
                fetchData();
            } else {
                setLoading(false);
            }
        });
    }
  }, [user]);

  const handleOpenModal = () => {
    setFormData({
      id_fut: '',
      tipo_solicitud: 'Licencia',
      asunto: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
    setArchivo(null);
    setIsModalOpen(true);
  };

  const handleOpenStatusModal = (item) => {
    setSelectedItem(item);
    setStatusData({
      estado: item.estado,
      observacion: item.observacion || ''
    });
    setIsStatusModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = new FormData();
    dataToSend.append('id_docente', user.id_docente);
    if (formData.id_fut) dataToSend.append('id_fut', formData.id_fut);
    dataToSend.append('tipo_solicitud', formData.tipo_solicitud);
    dataToSend.append('asunto', formData.asunto);
    dataToSend.append('descripcion', formData.descripcion);
    if (formData.fecha_inicio) dataToSend.append('fecha_inicio', formData.fecha_inicio);
    if (formData.fecha_fin) dataToSend.append('fecha_fin', formData.fecha_fin);
    if (archivo) {
      dataToSend.append('archivo', archivo);
    }

    try {
      await api.post('/solicitudes', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving solicitud:', error);
      alert('Error al enviar la solicitud.');
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/solicitudes/${selectedItem.id_solicitud}/estado`, statusData);
      setIsStatusModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado.');
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '#';
    return `http://localhost:5000${url}`;
  };

  const getStatusBadge = (estado) => {
    switch(estado) {
      case 'Aprobado': return <span style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}><CheckCircle size={12} style={{display:'inline', marginRight: '4px'}}/>Aprobado</span>;
      case 'Rechazado': return <span style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}><XCircle size={12} style={{display:'inline', marginRight: '4px'}}/>Rechazado</span>;
      case 'Observado': return <span style={{ color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}><Eye size={12} style={{display:'inline', marginRight: '4px'}}/>Observado</span>;
      default: return <span style={{ color: '#64748b', backgroundColor: 'rgba(100,116,139,0.1)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}><Clock size={12} style={{display:'inline', marginRight: '4px'}}/>Pendiente</span>;
    }
  };

  const columns = [
    { header: 'Solicitud', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '8px', 
          backgroundColor: '#f1f5f9', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ClipboardList size={20} />
        </div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{row.asunto}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.tipo_solicitud} • {new Date(row.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    )},
    ...(user.role !== 'docente' ? [{ header: 'Docente', render: (row) => (
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{row.nombres} {row.apellidos}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {row.dni}</div>
      </div>
    )}] : []),
    { header: 'Estado', render: (row) => getStatusBadge(row.estado) },
    { header: 'Adjunto', render: (row) => (
      row.archivo_adjunto ? (
        <a href={getFullUrl(row.archivo_adjunto)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <Download size={16} /> Ver PDF/DOCX
        </a>
      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin archivo</span>
    )},
    { header: 'Acciones', render: (row) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {user.role !== 'docente' && (
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleOpenStatusModal(row)}>
            Evaluar
          </button>
        )}
        {user.role === 'docente' && row.observacion && (
          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => alert(`Observación de Dirección: \n\n${row.observacion}`)}>
            Ver obs.
          </button>
        )}
      </div>
    )}
  ];

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Mesa de Partes / Trámites - fase implementacion</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de solicitudes documentarias (Licencias, permisos, justificaciones).</p>
        </div>
        {user.role === 'docente' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Modal for downloading templates could go here, or simple dropdown */}
            <div className="dropdown">
              <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={18} /> Descargar Plantilla FUT
              </button>
              {futs.length > 0 && (
                <div className="dropdown-content" style={{ position: 'absolute', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem', marginTop: '0.5rem', zIndex: 10, minWidth: '200px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  {futs.map(f => (
                    <a key={f.id_fut} href={getFullUrl(f.archivo_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '0.5rem', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.875rem', borderRadius: '0.25rem' }}>
                      📄 {f.nombre}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleOpenModal}>+ Nueva Solicitud</button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              {columns.map((c, i) => <th key={i} style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay solicitudes registradas.</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id_solicitud || i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {columns.map((c, j) => <td key={j} style={{ padding: '1rem' }}>{c.render ? c.render(row) : row[c.accessor]}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR SOLICITUD (DOCENTE) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Solicitud Documentaria">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Tipo de Solicitud</label>
              <select className="input" value={formData.tipo_solicitud} onChange={e => setFormData({...formData, tipo_solicitud: e.target.value})} required>
                <option value="Licencia">Licencia</option>
                <option value="Permiso">Permiso</option>
                <option value="Justificación">Justificación</option>
                <option value="Vacaciones">Vacaciones</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">FUT Asociado (Opcional)</label>
              <select className="input" value={formData.id_fut} onChange={e => setFormData({...formData, id_fut: e.target.value})}>
                <option value="">-- Ninguno --</option>
                {futs.map(f => <option key={f.id_fut} value={f.id_fut}>{f.nombre}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label className="label">Asunto</label>
            <input type="text" className="input" value={formData.asunto} onChange={e => setFormData({...formData, asunto: e.target.value})} required placeholder="Breve descripción del trámite" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Fecha Inicio (Opcional)</label>
              <input type="date" className="input" value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="label">Fecha Fin (Opcional)</label>
              <input type="date" className="input" value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Descripción Adicional / Sustento</label>
            <textarea className="input" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} style={{ minHeight: '80px' }}></textarea>
          </div>

          <div className="form-group">
            <label className="label">Documento Adjunto (FUT rellenado o Evidencia)</label>
            <input type="file" className="input" accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp" onChange={e => setArchivo(e.target.files[0])} style={{ padding: '0.5rem' }} />
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Enviar Solicitud</button>
          </div>
        </form>
      </Modal>

      {/* MODAL ESTADO (ADMIN) */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Evaluar Solicitud">
        {selectedItem && (
          <form onSubmit={handleStatusSubmit}>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>{selectedItem.asunto}</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Solicitado por: {selectedItem.nombres} {selectedItem.apellidos}</p>
            </div>
            
            <div className="form-group">
              <label className="label">Estado de Resolución</label>
              <select className="input" value={statusData.estado} onChange={e => setStatusData({...statusData, estado: e.target.value})} required>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Rechazado">Rechazado</option>
                <option value="Observado">Observado (Requiere corrección)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Observaciones / Respuesta de Dirección</label>
              <textarea className="input" value={statusData.observacion} onChange={e => setStatusData({...statusData, observacion: e.target.value})} style={{ minHeight: '100px' }} placeholder="Escriba los motivos o instrucciones para el docente..."></textarea>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsStatusModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar Evaluación</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SolicitudesPage;
