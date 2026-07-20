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

  // Detectar WiFi automáticamente (mejorado)
  const detectarWifi = async () => {
    try {
      const wifiInfo = await wifiDetector.detectWiFi();
      return {
        wifi_ssid: wifiInfo.wifi_ssid,
        wifi_bssid: wifiInfo.wifi_bssid
      };
    } catch (error) {
      console.warn('Error detectando WiFi:', error);
      return {
        wifi_ssid: 'WIFI_DETECTADO',
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mis Eventos</h1>
        <p className="text-gray-600">Eventos institucionales disponibles para registro de asistencia</p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{mensaje}</span>
          </div>
        </div>
      )}

      {/* Lista de Eventos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando eventos...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {eventos.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-500">
                No hay eventos en registro en este momento.
              </p>
            </div>
          ) : (
            eventos.map(evento => (
              <div key={evento.id_evento} className="bg-white rounded-lg shadow-md border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {evento.nombre_evento}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="capitalize">{formatearFecha(evento.fecha)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          {formatearHora(evento.hora_inicio)}
                          {evento.hora_fin && ` - ${formatearHora(evento.hora_fin)}`}
                        </span>
                      </div>
                    </div>

                    {evento.descripcion && (
                      <p className="text-gray-600 mb-4">{evento.descripcion}</p>
                    )}

                    <div className="flex items-center">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {evento.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estado de Registro */}
                {evento.ya_registrado ? (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="font-medium text-green-700">Ya registrado</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(evento.hora_registro).toLocaleString('es-PE')}
                        </div>
                        {evento.nivel_seguridad && (
                          <div className="flex items-center">
                            {getNivelSeguridadIcon(evento.nivel_seguridad)}
                            <span className="ml-1">{evento.nivel_seguridad}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">Estado: EN_REGISTRO</h4>
                        <p className="text-sm text-blue-600">
                          Puede registrar su asistencia a este evento
                        </p>
                      </div>
                      <button
                        onClick={() => registrarAsistenciaEvento(evento.id_evento)}
                        disabled={procesando}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {procesando ? 'Procesando...' : 'REGISTRAR ASISTENCIA'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Información de Ubicación Actual */}
      {ubicacion && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
          <div className="flex items-center mb-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span>Ubicación Detectada</span>
          </div>
          <div>Lat: {ubicacion.latitud.toFixed(6)}</div>
          <div>Lng: {ubicacion.longitud.toFixed(6)}</div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">Información Importante:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Solo puede registrarse una vez por evento</li>
              <li>• Debe encontrarse dentro del perímetro de la institución</li>
              <li>• El registro requiere ubicación GPS activa</li>
              <li>• Solo eventos en estado "EN_REGISTRO" permiten registro</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisEventosPage;