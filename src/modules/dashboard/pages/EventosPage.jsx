import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Users, Edit, Eye, X, Check, Trash2 } from 'lucide-react';
import api from '../../../services/api';

const EventosPage = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAsistentesModal, setShowAsistentesModal] = useState(false);
  const [asistentes, setAsistentes] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre_evento: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    descripcion: '',
    estado: 'PENDIENTE'
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Cargar eventos
  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/eventos');
      setEventos(response.data);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setError('Error cargando eventos');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre_evento: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      descripcion: '',
      estado: 'PENDIENTE'
    });
    setEditMode(false);
    setEventoSeleccionado(null);
  };

  const abrirModal = (evento = null) => {
    if (evento) {
      setFormData({
        nombre_evento: evento.nombre_evento,
        fecha: evento.fecha,
        hora_inicio: evento.hora_inicio,
        hora_fin: evento.hora_fin || '',
        descripcion: evento.descripcion || '',
        estado: evento.estado
      });
      setEventoSeleccionado(evento);
      setEditMode(true);
    } else {
      limpiarFormulario();
    }
    setShowModal(true);
    setError('');
    setMensaje('');
  };

  const cerrarModal = () => {
    setShowModal(false);
    limpiarFormulario();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && eventoSeleccionado) {
        await api.put(`/eventos/${eventoSeleccionado.id_evento}`, formData);
        setMensaje('Evento actualizado exitosamente');
      } else {
        await api.post('/eventos', formData);
        setMensaje('Evento creado exitosamente');
      }
      
      cargarEventos();
      cerrarModal();
    } catch (error) {
      console.error('Error guardando evento:', error);
      setError(error.response?.data?.message || 'Error guardando evento');
    }
  };

  const cambiarEstado = async (id_evento, nuevoEstado) => {
    try {
      await api.patch(`/eventos/${id_evento}/estado`, { estado: nuevoEstado });
      setMensaje(`Estado cambiado a ${nuevoEstado}`);
      cargarEventos();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setError(error.response?.data?.message || 'Error cambiando estado');
    }
  };

  const verAsistentes = async (evento) => {
    try {
      const response = await api.get(`/eventos/${evento.id_evento}/asistentes`);
      setAsistentes(response.data);
      setEventoSeleccionado(evento);
      setShowAsistentesModal(true);
    } catch (error) {
      console.error('Error cargando asistentes:', error);
      setError('Error cargando asistentes');
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'EN_REGISTRO': 'bg-green-100 text-green-800',
      'CERRADO': 'bg-gray-100 text-gray-800',
      'ANULADO': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Eventos Institucionales</h1>
          <p className="text-gray-600">Gestión de eventos y registro de asistencias</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <span className="text-green-700">{mensaje}</span>
        </div>
      )}

      {/* Lista de Eventos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {eventos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay eventos creados</p>
            </div>
          ) : (
            eventos.map(evento => (
              <div key={evento.id_evento} className="bg-white rounded-lg shadow-md border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {evento.nombre_evento}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="capitalize">{formatearFecha(evento.fecha)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatearHora(evento.hora_inicio)}
                          {evento.hora_fin && ` - ${formatearHora(evento.hora_fin)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{evento.total_asistentes} asistentes</span>
                      </div>
                    </div>
                    {evento.descripcion && (
                      <p className="text-gray-600 text-sm">{evento.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(evento.estado)}`}>
                      {evento.estado}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => abrirModal(evento)}
                    className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>

                  <button
                    onClick={() => verAsistentes(evento)}
                    className="flex items-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Asistentes
                  </button>

                  {evento.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => cambiarEstado(evento.id_evento, 'EN_REGISTRO')}
                      className="flex items-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Abrir Registro
                    </button>
                  )}

                  {evento.estado === 'EN_REGISTRO' && (
                    <button
                      onClick={() => cambiarEstado(evento.id_evento, 'CERRADO')}
                      className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cerrar Evento
                    </button>
                  )}

                  {(evento.estado === 'PENDIENTE' || evento.estado === 'EN_REGISTRO') && (
                    <button
                      onClick={() => cambiarEstado(evento.id_evento, 'ANULADO')}
                      className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Anular
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editMode ? 'Editar Evento' : 'Nuevo Evento'}
              </h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  name="nombre_evento"
                  value={formData.nombre_evento}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="EN_REGISTRO">EN_REGISTRO</option>
                    <option value="CERRADO">CERRADO</option>
                    <option value="ANULADO">ANULADO</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción opcional del evento..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editMode ? 'Actualizar' : 'Crear Evento'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asistentes */}
      {showAsistentesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Asistentes - {eventoSeleccionado?.nombre_evento}
              </h2>
              <button 
                onClick={() => setShowAsistentesModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {asistentes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay asistentes registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left">Docente</th>
                      <th className="border p-2 text-left">DNI</th>
                      <th className="border p-2 text-left">Área</th>
                      <th className="border p-2 text-left">Grado/Sección</th>
                      <th className="border p-2 text-left">Hora Registro</th>
                      <th className="border p-2 text-left">Seguridad</th>
                      <th className="border p-2 text-left">Distancia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistentes.map(asistente => (
                      <tr key={asistente.id_asistencia_evento}>
                        <td className="border p-2">
                          {asistente.nombres} {asistente.apellidos}
                        </td>
                        <td className="border p-2">{asistente.dni}</td>
                        <td className="border p-2">{asistente.area || '-'}</td>
                        <td className="border p-2">
                          {asistente.grado && asistente.seccion 
                            ? `${asistente.grado} "${asistente.seccion}"` 
                            : '-'}
                        </td>
                        <td className="border p-2">
                          {new Date(asistente.hora_registro).toLocaleString('es-PE')}
                        </td>
                        <td className="border p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            asistente.nivel_seguridad === 'ALTA' ? 'bg-green-100 text-green-800' :
                            asistente.nivel_seguridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {asistente.nivel_seguridad}
                          </span>
                        </td>
                        <td className="border p-2">
                          {asistente.distancia_metros ? `${asistente.distancia_metros}m` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventosPage;