import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import Modal from '../../../components/common/Modal';
import { useAuth } from '../../../context/AuthContext';
import { 
  Folder, 
  FileText, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Plus, 
  Search, 
  Eye, 
  Filter, 
  FileUp,
  MessageSquare,
  Sparkles,
  Pencil,
  Trash2
} from 'lucide-react';

const GestionDocumentalPage = () => {
  const { user } = useAuth();
  const isAdminOrDirector = ['administrador', 'director'].includes(user?.role);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState(isAdminOrDirector ? 'documentos' : 'plantillas');
  
  // Data States
  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editCategoryForm, setEditCategoryForm] = useState({ id: null, nombre: '', descripcion: '' });

  // Forms States
  const [categoryForm, setCategoryForm] = useState({ nombre: '', descripcion: '' });
  const [plantillaFile, setPlantillaFile] = useState(null);

  const [uploadForm, setUploadForm] = useState({ categoria_id: '' });
  const [userDocFile, setUserDocFile] = useState(null);

  const [evalForm, setEvalForm] = useState({ id: null, estado: 'Recibido', observacion: '', nombreDocumento: '', docenteNombre: '' });

  // Google Drive OAuth States
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const checkDriveStatus = async () => {
    if (!isAdminOrDirector) return;
    try {
      const res = await api.get('/documentos/auth/status');
      setDriveConnected(res.data.connected);
      setDriveEmail(res.data.email);
    } catch (err) {
      console.error('Error al verificar estado de Google Drive:', err);
    }
  };

  const handleConnectDrive = async () => {
    try {
      setAuthLoading(true);
      const res = await api.get('/documentos/auth/url');
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        alert('No se pudo obtener la URL de vinculación. Revisa la consola o las variables de entorno.');
      }
    } catch (err) {
      console.error('Error al conectar Google Drive:', err);
      alert('Error de conexión con el servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desvincular Google Drive? El sistema volverá al modo de simulación local.')) return;
    try {
      setAuthLoading(true);
      await api.post('/documentos/auth/disconnect');
      await checkDriveStatus();
      alert('Cuenta desvinculada con éxito.');
    } catch (err) {
      console.error('Error al desvincular Google Drive:', err);
      alert('Error al desvincular la cuenta.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch all categories and templates
  const fetchCategories = async () => {
    try {
      const res = await api.get('/documentos/categorias');
      setCategories(res.data);
    } catch (err) {
      console.error('Error al obtener categorías:', err);
    }
  };

  // Fetch documents (Admin/Director list or Docente list)
  const fetchDocuments = async () => {
    try {
      const endpoint = isAdminOrDirector ? '/documentos/admin/listado' : '/documentos/mis-documentos';
      const res = await api.get(endpoint);
      setDocuments(res.data);
    } catch (err) {
      console.error('Error al obtener documentos:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchDocuments()]);
    if (isAdminOrDirector) {
      await checkDriveStatus();
    }
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      alert('¡Cuenta de Google vinculada con éxito y sincronizada con el sistema!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    loadData();
  }, [user]);

  // Handle category submission (Admin/Director)
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.nombre) return alert('El nombre de la categoría es obligatorio.');

    const formData = new FormData();
    formData.append('nombre', categoryForm.nombre);
    formData.append('descripcion', categoryForm.descripcion);
    if (plantillaFile) {
      formData.append('plantilla', plantillaFile);
    }

    try {
      setLoading(true);
      await api.post('/documentos/categorias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCategoryForm({ nombre: '', descripcion: '' });
      setPlantillaFile(null);
      setIsCategoryModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error al crear categoría:', err);
      alert(err.response?.data?.message || 'Error al crear la categoría. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Handle docente document upload
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadForm.categoria_id) return alert('Debe seleccionar una categoría.');
    if (!userDocFile) return alert('Debe adjuntar su archivo completado.');

    const formData = new FormData();
    formData.append('categoria_id', uploadForm.categoria_id);
    formData.append('documento', userDocFile);

    try {
      setLoading(true);
      await api.post('/documentos/subir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadForm({ categoria_id: '' });
      setUserDocFile(null);
      setIsUploadModalOpen(false);
      await fetchDocuments();
    } catch (err) {
      console.error('Error al subir documento:', err);
      alert(err.response?.data?.message || 'Error al subir el documento. Por favor verifique.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status evaluation (Admin/Director)
  const handleEvaluateDocument = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/documentos/admin/estado/${evalForm.id}`, {
        estado: evalForm.estado,
        observacion: evalForm.observacion
      });
      setIsEvalModalOpen(false);
      setEvalForm({ id: null, estado: 'Recibido', observacion: '', nombreDocumento: '', docenteNombre: '' });
      await fetchDocuments();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al guardar la evaluación.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de edición de categoría
  const handleEditCategory = (cat) => {
    setEditCategoryForm({ id: cat.id, nombre: cat.nombre, descripcion: cat.descripcion || '' });
    setIsEditCategoryModalOpen(true);
  };

  // Guardar actualización de categoría
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryForm.nombre) return alert('El nombre es obligatorio.');
    try {
      setLoading(true);
      await api.put(`/documentos/categorias/${editCategoryForm.id}`, {
        nombre: editCategoryForm.nombre,
        descripcion: editCategoryForm.descripcion
      });
      setIsEditCategoryModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"?\n\nSe eliminarán TODAS las plantillas y documentos docentes asociados. Esta acción no se puede deshacer.`)) return;
    try {
      setLoading(true);
      await api.delete(`/documentos/categorias/${cat.id}`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar documento subido por docente
  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`¿Estás seguro de eliminar el documento "${doc.nombre}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      setLoading(true);
      await api.delete(`/documentos/admin/documento/${doc.id}`);
      await fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el documento.');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge styles
  const getStatusBadge = (estado) => {
    const badges = {
      'En espera': { icon: <Clock size={14} />, bg: '#f1f5f9', color: '#64748b', text: 'En espera' },
      'Recibido': { icon: <Sparkles size={14} />, bg: '#eff6ff', color: '#2563eb', text: 'Recibido' },
      'Observado': { icon: <AlertTriangle size={14} />, bg: '#fffbeb', color: '#d97706', text: 'Observado' },
      'Aprobado': { icon: <CheckCircle2 size={14} />, bg: '#ecfdf5', color: '#059669', text: 'Aprobado' },
      'Rechazado': { icon: <XCircle size={14} />, bg: '#fef2f2', color: '#dc2626', text: 'Rechazado' },
    };

    const current = badges[estado] || badges['En espera'];
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '2rem',
        fontSize: '0.75rem',
        fontWeight: '700',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.color}20`
      }}>
        {current.icon}
        {current.text}
      </span>
    );
  };

  // Filtered lists
  const filteredDocuments = documents.filter(doc => {
    const matchCategory = selectedCategoryFilter === '' || doc.categoria_id === parseInt(selectedCategoryFilter);
    const searchString = `${doc.nombre} ${doc.usuario_nombres || ''} ${doc.usuario_apellidos || ''} ${doc.usuario_dni || ''}`.toLowerCase();
    const matchSearch = searchString.includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header section with Premium design */}
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(37, 99, 235, 0.05) 100%)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Folder className="text-primary" size={32} /> Gestión Documental
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isAdminOrDirector 
              ? 'Administra las categorías de documentos, plantillas oficiales y evalúa el trabajo docente.'
              : 'Descarga plantillas oficiales autorizadas por dirección y sube tus documentos completados.'
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdminOrDirector ? (
            <button 
              className="btn btn-primary"
              onClick={() => setIsCategoryModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', padding: '0.75rem 1.25rem' }}
            >
              <Plus size={18} /> Nueva Categoría
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (categories.length === 0) {
                  alert('No hay categorías configuradas por dirección actualmente.');
                  return;
                }
                setUploadForm({ categoria_id: categories[0]?.id || '' });
                setIsUploadModalOpen(true);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', padding: '0.75rem 1.25rem' }}
            >
              <FileUp size={18} /> Subir Documento
            </button>
          )}
        </div>
      </div>

      {/* Google Drive Status Panel (Admin/Director Only) */}
      {isAdminOrDirector && (
        <div style={{
          marginBottom: '2rem',
          background: driveConnected 
            ? 'linear-gradient(135deg, var(--surface) 0%, rgba(16, 185, 129, 0.03) 100%)' 
            : 'linear-gradient(135deg, var(--surface) 0%, rgba(245, 158, 11, 0.03) 100%)',
          border: driveConnected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              backgroundColor: driveConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: driveConnected ? '#10b981' : '#f59e0b',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {driveConnected ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Conexión con Google Drive
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '1rem',
                  backgroundColor: driveConnected ? '#ecfdf5' : '#fffbeb',
                  color: driveConnected ? '#059669' : '#d97706',
                  border: driveConnected ? '1px solid #10b98130' : '1px solid #f59e0b30',
                  textTransform: 'uppercase'
                }}>
                  {driveConnected ? 'Activo (OAuth2)' : 'Desconectado'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', maxWidth: '650px', lineHeight: '1.4' }}>
                {driveConnected 
                  ? `El sistema está conectado a Google Drive (${driveEmail}). Todas las plantillas y entregas docentes se subirán a tu almacenamiento personal o institucional sin límites.`
                  : 'El sistema actualmente opera en modo de simulación local. Vincula una cuenta de Google real (personal o institucional) para habilitar el guardado automático de documentos en tu Drive.'
                }
              </p>
            </div>
          </div>
          <div>
            {driveConnected ? (
              <button
                className="btn btn-outline"
                onClick={handleDisconnectDrive}
                disabled={authLoading}
                style={{
                  color: '#ef4444',
                  borderColor: '#ef444430',
                  fontWeight: '600',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.85rem'
                }}
              >
                {authLoading ? 'Procesando...' : 'Desconectar Drive'}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleConnectDrive}
                disabled={authLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '700',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
                }}
              >
                <Sparkles size={16} />
                {authLoading ? 'Cargando...' : 'Vincular cuenta Google'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid var(--border)', 
        marginBottom: '2rem',
        gap: '2rem' 
      }}>
        {isAdminOrDirector && (
          <button
            onClick={() => setActiveTab('documentos')}
            style={{
              padding: '1rem 0.5rem',
              fontWeight: '700',
              fontSize: '1rem',
              color: activeTab === 'documentos' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'documentos' ? '3px solid var(--primary)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            Documentos Recibidos
          </button>
        )}

        <button
          onClick={() => setActiveTab('plantillas')}
          style={{
            padding: '1rem 0.5rem',
            fontWeight: '700',
            fontSize: '1rem',
            color: activeTab === 'plantillas' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'plantillas' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          {isAdminOrDirector ? 'Categorías y Plantillas' : 'Plantillas Oficiales'}
        </button>

        {!isAdminOrDirector && (
          <button
            onClick={() => setActiveTab('mis-envios')}
            style={{
              padding: '1rem 0.5rem',
              fontWeight: '700',
              fontSize: '1rem',
              color: activeTab === 'mis-envios' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'mis-envios' ? '3px solid var(--primary)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            Mis Documentos Enviados
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '3px solid rgba(37,99,235,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p>Cargando información y sincronizando con Google Drive...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Documentos Recibidos (ADMIN / DIRECTOR VIEW) */}
          {activeTab === 'documentos' && isAdminOrDirector && (
            <div>
              {/* Filters Bar */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Search box */}
                <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Buscar por documento, docente o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Dropdown Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
                  <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Todas las Categorías</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table List of documents */}
              {filteredDocuments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--surface)' }}>
                  <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No se encontraron documentos</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay registros que coincidan con los filtros seleccionados.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>DOCENTE</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>DOCUMENTO</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>CATEGORÍA</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>FECHA</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>ESTADO</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right' }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} className="table-row-hover">
                          {/* Docente info */}
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{doc.usuario_nombres} {doc.usuario_apellidos}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {doc.usuario_dni} | {doc.usuario_correo}</div>
                          </td>
                          {/* Document Name & Download Link */}
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={18} style={{ color: 'var(--primary)' }} />
                              <a 
                                href={doc.drive_file_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'none' }}
                              >
                                {doc.nombre}
                              </a>
                            </div>
                          </td>
                          {/* Category */}
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-main)', fontWeight: '500' }}>
                            {doc.categoria_nombre}
                          </td>
                          {/* Created date */}
                          <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          {/* Status Badge */}
                          <td style={{ padding: '1.25rem 1rem' }}>
                            {getStatusBadge(doc.estado)}
                            {doc.observacion && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-muted)', 
                                marginTop: '0.35rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                maxWidth: '220px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                <MessageSquare size={12} /> {doc.observacion}
                              </div>
                            )}
                          </td>
                          {/* Actions */}
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <a 
                                href={doc.drive_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                <Download size={14} /> Ver en Drive
                              </a>
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  setEvalForm({
                                    id: doc.id,
                                    estado: doc.estado,
                                    observacion: doc.observacion || '',
                                    nombreDocumento: doc.nombre,
                                    docenteNombre: `${doc.usuario_nombres} ${doc.usuario_apellidos}`
                                  });
                                  setIsEvalModalOpen(true);
                                }}
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: '700' }}
                              >
                                Evaluar
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc)}
                                title="Eliminar documento"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  padding: '0.4rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer',
                                  backgroundColor: 'transparent', border: '1px solid #ef444430',
                                  color: '#ef4444', borderRadius: '0.5rem', transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Trash2 size={14} />
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
          )}

          {/* TAB 2: Categorías y Plantillas (AMBOS ROLES) */}
          {activeTab === 'plantillas' && (
            <div>
              {categories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--surface)' }}>
                  <Folder size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No hay categorías de documentos</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Aún no se han configurado categorías de plantillas oficiales en el sistema.</p>
                  {isAdminOrDirector && (
                    <button className="btn btn-primary" onClick={() => setIsCategoryModalOpen(true)}>Crear Primera Categoría</button>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border)',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      className="card-hover"
                    >
                      <div>
                        {/* Title and Drive Indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Folder size={22} />
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.04)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            Drive Sync
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                          {cat.nombre}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1.5rem', minHeight: '40px' }}>
                          {cat.descripcion || 'Sin descripción detallada.'}
                        </p>
                      </div>

                      {/* Templates block */}
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                          Plantilla Oficial
                        </h4>
                        
                        {cat.plantillas && cat.plantillas.length > 0 ? (
                          cat.plantillas.map((p) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.01)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {p.nombre}
                                </span>
                              </div>
                              <a 
                                href={p.drive_file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', textDecoration: 'none', padding: '0.25rem', borderRadius: '4px' }}
                                title="Descargar Plantilla"
                              >
                                <Download size={16} />
                              </a>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            Sin plantilla oficial adjunta.
                          </div>
                        )}

                        {/* Teacher Action */}
                        {!isAdminOrDirector && (
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setUploadForm({ categoria_id: cat.id });
                              setIsUploadModalOpen(true);
                            }}
                            style={{ width: '100%', marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700' }}
                          >
                            <FileUp size={16} /> Subir Documento
                          </button>
                        )}

                        {/* Admin/Director Actions */}
                        {isAdminOrDirector && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleEditCategory(cat)}
                              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '600', padding: '0.55rem' }}
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              style={{
                                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                fontSize: '0.82rem', fontWeight: '600', padding: '0.55rem',
                                backgroundColor: 'transparent', border: '1px solid #ef444430',
                                color: '#ef4444', borderRadius: '0.5rem', cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Mis Documentos Enviados (TEACHER VIEW) */}
          {activeTab === 'mis-envios' && !isAdminOrDirector && (
            <div>
              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--surface)' }}>
                  <FileUp size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No has enviado documentos</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Aquí aparecerá el historial de todos tus documentos completados enviados a dirección.</p>
                  <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>Subir Mi Primer Documento</button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>DOCUMENTO</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>CATEGORÍA</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>FECHA DE ENVÍO</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>ESTADO</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>OBSERVACIONES</th>
                        <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right' }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          {/* File detail */}
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{doc.nombre}</span>
                            </div>
                          </td>
                          {/* Category */}
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-main)', fontWeight: '500' }}>
                            {doc.categoria_nombre}
                          </td>
                          {/* Upload date */}
                          <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          {/* Status Badge */}
                          <td style={{ padding: '1.25rem 1rem' }}>
                            {getStatusBadge(doc.estado)}
                          </td>
                          {/* Observation / Feedback */}
                          <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                            {doc.observacion ? (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', color: 'var(--text-main)' }}>
                                <MessageSquare size={14} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                                <span>{doc.observacion}</span>
                              </div>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Sin observaciones de Dirección</span>
                            )}
                          </td>
                          {/* Actions */}
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                            <a 
                              href={doc.drive_file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-outline"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              <Download size={14} /> Descargar
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: Crear Categoría (ADMIN/DIRECTOR ONLY) */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Crear Nueva Categoría Documental"
      >
        <form onSubmit={handleCreateCategory}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="label">Nombre de la Categoría</label>
            <input 
              type="text" 
              className="input" 
              value={categoryForm.nombre}
              onChange={(e) => setCategoryForm({ ...categoryForm, nombre: e.target.value })}
              required
              placeholder="Ej. Solicitudes, Oficios, Informes..."
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Se crearán automáticamente las carpetas en Google Drive para plantillas y para docentes.
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="label">Descripción</label>
            <textarea 
              className="input" 
              value={categoryForm.descripcion}
              onChange={(e) => setCategoryForm({ ...categoryForm, descripcion: e.target.value })}
              placeholder="Describe qué tipo de documentos pertenecen a esta categoría..."
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Plantilla Oficial Inicial (Opcional - Word/PDF)</label>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: '0.5rem',
              padding: '1.5rem 1rem',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.01)'
            }}>
              <UploadCloud size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setPlantillaFile(e.target.files[0])}
                style={{ display: 'block', margin: '0 auto', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Formatos permitidos: Word (.doc, .docx), Excel (.xls, .xlsx), PDF hasta 5MB.
              </span>
            </div>
            {plantillaFile && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FileText size={14} /> Seleccionado: {plantillaFile.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sincronizando Drive...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Subir Documento (DOCENTE) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Subir Documento Completado"
      >
        <form onSubmit={handleUploadDocument}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="label">Selecciona la Categoría</label>
            <select
              value={uploadForm.categoria_id}
              onChange={(e) => setUploadForm({ ...uploadForm, categoria_id: e.target.value })}
              className="input"
              required
              style={{ cursor: 'pointer' }}
            >
              <option value="" disabled>Selecciona una categoría...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Adjuntar Documento Completado (Word/PDF)</label>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: '0.5rem',
              padding: '1.5rem 1rem',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.01)'
            }}>
              <UploadCloud size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setUserDocFile(e.target.files[0])}
                required
                style={{ display: 'block', margin: '0 auto', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Formatos permitidos: Word (.doc, .docx), Excel (.xls, .xlsx), PDF hasta 5MB.
              </span>
            </div>
            {userDocFile && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FileText size={14} /> Seleccionado: {userDocFile.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsUploadModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Subiendo a Drive...' : 'Enviar Documento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Evaluar Documento (ADMIN/DIRECTOR ONLY) */}
      <Modal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        title="Evaluar Documento Docente"
      >
        <form onSubmit={handleEvaluateDocument}>
          <div style={{ marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Docente remitente</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{evalForm.docenteNombre}</div>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Nombre del archivo</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>{evalForm.nombreDocumento}</div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="label">Nuevo Estado del Documento</label>
            <select
              value={evalForm.estado}
              onChange={(e) => setEvalForm({ ...evalForm, estado: e.target.value })}
              className="input"
              required
              style={{ cursor: 'pointer', fontWeight: '700' }}
            >
              <option value="En espera">En espera</option>
              <option value="Recibido">Recibido</option>
              <option value="Observado">Observado</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Al guardar, se enviará una notificación automática por correo al docente con su decisión.
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Observación / Comentarios de Dirección</label>
            <textarea 
              className="input" 
              value={evalForm.observacion}
              onChange={(e) => setEvalForm({ ...evalForm, observacion: e.target.value })}
              placeholder="Escribe observaciones o instrucciones adicionales para el docente (ej. si está observado, qué debe corregir)..."
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEvalModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Evaluación'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Editar Categoría (ADMIN/DIRECTOR ONLY) */}
      <Modal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        title="Editar Categoría Documental"
      >
        <form onSubmit={handleUpdateCategory}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="label">Nombre de la Categoría</label>
            <input
              type="text"
              className="input"
              value={editCategoryForm.nombre}
              onChange={(e) => setEditCategoryForm({ ...editCategoryForm, nombre: e.target.value })}
              required
              placeholder="Nombre de la categoría..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Descripción</label>
            <textarea
              className="input"
              value={editCategoryForm.descripcion}
              onChange={(e) => setEditCategoryForm({ ...editCategoryForm, descripcion: e.target.value })}
              placeholder="Descripción de la categoría..."
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b30', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0, display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
              Solo se actualiza el nombre y descripción en la base de datos. Las carpetas en Google Drive conservarán su nombre original.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEditCategoryModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>
      
    </div>
  );
};

export default GestionDocumentalPage;
