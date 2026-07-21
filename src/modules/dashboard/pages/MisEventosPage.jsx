import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Wifi, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import wifiDetector from '../../../utils/wifiDetector';
import locationDetector from '../../../utils/locationDetector';

const MisEventosPage = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Cargar eventos disponibles
  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/eventos/disponibles/mis-eventos');
      setEventos(response.data);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setError('Error cargando eventos disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Obtener ubicación GPS automáticamente (mejorado)
  const obtenerUbicacion = async () => {
    try {
      const location = await locationDetector.getCurrentLocation('balanced');
      return {
        latitud: location.latitud,
        longitud: location.longitud
      };
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      throw new Error('No se pudo obtener la ubicación: ' + error.message);
    }
  };

  // Detectar WiFi (informativo solamente)
  const detectarWifi = async () => {
    try {
      const wifiInfo = await wifiDetector.detectWiFi();
      return {
        wifi_ssid: wifiInfo.wifi_ssid || 'No detectado',
        wifi_bssid: wifiInfo.wifi_bssid
      };
    } catch (error) {
      console.warn('WiFi no detectado (continuando sin problema)');
      return {
        wifi_ssid: 'No detectado',
        wifi_bssid: null
      };
    }
  };

  // Registrar asistencia a evento
  const registrarAsistenciaEvento = async (id_evento) => {
    try {
      setProcesando(true);
      setError('');
      setMensaje('');

      // Obtener ubicación GPS
      const coords = await obtenerUbicacion();
      
      // Detectar WiFi
      const wifiData = await detectarWifi();

      // Enviar registro
      const response = await api.post(`/eventos/${id_evento}/asistencia`, {
        ...coords,
        ...wifiData
      });

      setMensaje('¡Asistencia al evento registrada correctamente!');
      
      // Recargar eventos para actualizar el estado
      await cargarEventos();

    } catch (error) {
      console.error('Error registrando asistencia:', error);
      const errorMsg = error.response?.data?.message || 'Error registrando asistencia al evento';
      setError(errorMsg);
    } finally {
      setProcesando(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear hora
  const formatearHora = (hora) => {
    return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener el ícono del nivel de seguridad
  const getNivelSeguridadIcon = (nivel) => {
    switch (nivel) {
      case 'ALTA': return <Shield className="w-4 h-4 text-green-500" />;
      case 'MEDIA': return <Shield className="w-4 h-4 text-yellow-500" />;
      case 'BAJA': return <Shield className="w-4 h-4 text-red-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl p-6 shadow-xl">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold mb-2">Mis Eventos</h1>
            <p className="text-green-100">Eventos institucionales disponibles para registro</p>
          </div>
        </div>

        {/* Mensajes mejorados */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-md animate-slide-down">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-500 mr-3 animate-bounce" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {mensaje && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-lg p-4 mb-6 shadow-md animate-slide-down">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3 animate-bounce" />
              <span className="text-green-800 font-medium">{mensaje}</span>
            </div>
          </div>
        )}

        {/* Lista de Eventos mejorada */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <CalendarIcon className="w-8 h-8 text-green-600 absolute inset-0 m-auto" />
            </div>
            <span className="mt-4 text-green-600 font-medium">Cargando eventos...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {eventos.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CalendarIcon className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3">No hay eventos disponibles</h3>
                <p className="text-gray-500 text-lg">
                  No hay eventos en registro en este momento.
                </p>
              </div>
            ) : (
              eventos.map(evento => (
                <div key={evento.id_evento} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-gradient-to-br from-green-500 to-teal-500 p-3 rounded-xl shadow-lg">
                          <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {evento.nombre_evento}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium">FECHA</p>
                            <p className="capitalize font-bold text-blue-900">{formatearFecha(evento.fecha)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-xl">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-green-600 font-medium">HORARIO</p>
                            <p className="font-bold text-green-900">
                              {formatearHora(evento.hora_inicio)}
                              {evento.hora_fin && ` - ${formatearHora(evento.hora_fin)}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {evento.descripcion && (
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 mb-6 border border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{evento.descripcion}</p>
                        </div>
                      )}

                      <div className="flex items-center">
                        <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold border border-green-300">
                          {evento.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estado de Registro mejorado */}
                  {evento.ya_registrado ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-green-800 text-lg">¡Registro Exitoso!</p>
                            <p className="text-green-600">Ya está registrado para este evento</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600 font-medium">Registrado el:</p>
                          <div className="flex items-center gap-2 text-green-800">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold">
                              {new Date(evento.hora_registro).toLocaleString('es-PE')}
                            </span>
                          </div>
                          {evento.nivel_seguridad && (
                            <div className="flex items-center gap-2 mt-2">
                              {getNivelSeguridadIcon(evento.nivel_seguridad)}
                              <span className="text-sm font-medium">{evento.nivel_seguridad}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <CalendarIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-800 text-lg">Estado: EN_REGISTRO</h4>
                            <p className="text-blue-600">
                              Puede registrar su asistencia a este evento
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => registrarAsistenciaEvento(evento.id_evento)}
                          disabled={procesando}
                          className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          <span className="relative z-10 flex items-center">
                            {procesando ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                Procesando...
                              </>
                            ) : (
                              <>
                                <MapPin className="w-5 h-5 mr-3" />
                                REGISTRAR ASISTENCIA
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Información de Ubicación */}
        {ubicacion && (
          <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-xl p-4 text-sm text-gray-600 border border-gray-200 shadow-md">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium">Ubicación GPS Detectada</span>
            </div>
            <div className="ml-9 space-y-1">
              <div>Lat: <span className="font-mono">{ubicacion.latitud.toFixed(6)}</span></div>
              <div>Lng: <span className="font-mono">{ubicacion.longitud.toFixed(6)}</span></div>
            </div>
          </div>
        )}

        {/* Información adicional mejorada */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-md">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-blue-800 mb-3">Información del Registro:</p>
              <ul className="text-blue-700 space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <strong>GPS obligatorio</strong> - Debe estar activado y con buena señal
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Solo puede registrarse una vez por evento
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Debe encontrarse dentro del perímetro de la institución
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Solo eventos en estado "EN_REGISTRO" permiten registro
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisEventosPage;