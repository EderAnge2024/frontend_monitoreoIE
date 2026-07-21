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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header con gradiente */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Eventos Institucionales
              </h1>
              <p className="text-gray-600 mt-1">Gestión de eventos y registro de asistencias</p>
            </div>
          </div>
          <button
            onClick={() => abrirModal()}
            className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nuevo Evento</span>
          </button>
        </div>

        {/* Mensajes mejorados */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-md animate-slide-down">
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}

        {mensaje && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-lg p-4 mb-6 shadow-md animate-slide-down">
            <span className="text-green-800 font-medium">{mensaje}</span>
          </div>
        )}

        {/* Lista de Eventos mejorada */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <Calendar className="w-8 h-8 text-purple-600 absolute inset-0 m-auto" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {eventos.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Calendar className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No hay eventos creados</p>
                <button
                  onClick={() => abrirModal()}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                >
                  Crear el primer evento
                </button>
              </div>
            ) : (
              eventos.map(evento => (
                <div key={evento.id_evento} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-xl shadow-lg">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {evento.nombre_evento}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-6 text-gray-600 mb-4">
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="capitalize font-medium">{formatearFecha(evento.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            {formatearHora(evento.hora_inicio)}
                            {evento.hora_fin && ` - ${formatearHora(evento.hora_fin)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">{evento.total_asistentes} asistentes</span>
                        </div>
                      </div>
                      
                      {evento.descripcion && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-700 leading-relaxed">{evento.descripcion}</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${getEstadoColor(evento.estado)}`}>
                        {evento.estado}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción mejorados */}
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => abrirModal(evento)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>

                    <button
                      onClick={() => verAsistentes(evento)}
                      className="flex items-center gap-2 px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Asistentes
                    </button>

                    {evento.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => cambiarEstado(evento.id_evento, 'EN_REGISTRO')}
                        className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        <Check className="w-4 h-4" />
                        Abrir Registro
                      </button>
                    )}

                    {evento.estado === 'EN_REGISTRO' && (
                      <button
                        onClick={() => cambiarEstado(evento.id_evento, 'CERRADO')}
                        className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        Cerrar Evento
                      </button>
                    )}

                    {(evento.estado === 'PENDIENTE' || evento.estado === 'EN_REGISTRO') && (
                      <button
                        onClick={() => cambiarEstado(evento.id_evento, 'ANULADO')}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors duration-200"
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

      {/* Modal Formulario mejorado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editMode ? 'Editar Evento' : 'Nuevo Evento'}
                </h2>
                <button 
                  onClick={cerrarModal} 
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  name="nombre_evento"
                  value={formData.nombre_evento}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Ej: Reunión Pedagógica Mensual"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {editMode && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="EN_REGISTRO">EN_REGISTRO</option>
                    <option value="CERRADO">CERRADO</option>
                    <option value="ANULADO">ANULADO</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Descripción opcional del evento..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {editMode ? 'Actualizar Evento' : 'Crear Evento'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 font-bold transition-colors"
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
    </div>
  );
};

export default EventosPage;