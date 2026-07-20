import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Wifi, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import api from '../../../services/api';

const AsistenciaPage = () => {
  const [asistencia, setAsistencia] = useState(null);
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [wifi, setWifi] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Obtener fecha actual formateada
  const fechaActual = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar configuración y asistencia del día en paralelo
      const [configRes, asistenciaRes] = await Promise.all([
        api.get('/asistencias/configuracion'),
        api.get('/asistencias/hoy')
      ]);

      setConfiguracion(configRes.data);
      
      if (asistenciaRes.data.registrado) {
        setAsistencia(asistenciaRes.data.asistencia);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando configuración de asistencia');
    } finally {
      setLoading(false);
    }
  };

  // Obtener ubicación GPS
  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          };
          setUbicacion(coords);
          resolve(coords);
        },
        (error) => {
          reject(new Error('Error obteniendo ubicación: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Detectar WiFi (simulado - en producción requiere app nativa)
  const detectarWifi = () => {
    return new Promise((resolve) => {
      // En un entorno web real, esto requeriría una app nativa o extensión
      // Por ahora simulamos la detección
      const wifiDetectado = {
        wifi_ssid: 'IE_NETWORK', // Simular nombre de red detectado
        wifi_bssid: null
      };
      setWifi(wifiDetectado);
      resolve(wifiDetectado);
    });
  };

  // Registrar ingreso
  const registrarIngreso = async () => {
    try {
      setProcesando(true);
      setError('');
      setMensaje('');

      // Obtener ubicación GPS
      const coords = await obtenerUbicacion();
      
      // Detectar WiFi
      const wifiData = await detectarWifi();

      // Enviar registro
      const response = await api.post('/asistencias/ingreso', {
        ...coords,
        ...wifiData
      });

      setAsistencia(response.data.asistencia);
      setMensaje('¡Ingreso registrado correctamente!');

    } catch (error) {
      console.error('Error registrando ingreso:', error);
      const errorMsg = error.response?.data?.message || 'Error registrando ingreso';
      setError(errorMsg);
    } finally {
      setProcesando(false);
    }
  };

  // Registrar salida
  const registrarSalida = async () => {
    try {
      setProcesando(true);
      setError('');
      setMensaje('');

      // Obtener ubicación GPS (opcional para salida)
      let coords = {};
      try {
        coords = await obtenerUbicacion();
      } catch (e) {
        console.warn('No se pudo obtener ubicación para salida');
      }

      // Detectar WiFi
      const wifiData = await detectarWifi();

      // Enviar registro
      const response = await api.post('/asistencias/salida', {
        ...coords,
        ...wifiData
      });

      setAsistencia(response.data.asistencia);
      setMensaje('¡Salida registrada correctamente!');

    } catch (error) {
      console.error('Error registrando salida:', error);
      const errorMsg = error.response?.data?.message || 'Error registrando salida';
      setError(errorMsg);
    } finally {
      setProcesando(false);
    }
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PUNTUAL': return 'text-green-600';
      case 'TARDANZA': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Función para obtener el ícono del nivel de seguridad
  const getNivelSeguridadIcon = (nivel) => {
    switch (nivel) {
      case 'ALTA': return <Shield className="w-5 h-5 text-green-500" />;
      case 'MEDIA': return <Shield className="w-5 h-5 text-yellow-500" />;
      case 'BAJA': return <Shield className="w-5 h-5 text-red-500" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  if (!configuracion) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">
              No hay configuración de asistencia para esta institución. 
              Contacte al director.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mi Asistencia</h1>
        <p className="text-gray-600 capitalize">{fechaActual}</p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{mensaje}</span>
          </div>
        </div>
      )}

      {/* Estado Actual */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-lg font-semibold mb-4">Estado Actual</h2>
        
        {!asistencia ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No registrado</p>
            <button
              onClick={registrarIngreso}
              disabled={procesando}
              className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {procesando ? 'Procesando...' : 'REGISTRAR INGRESO'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Información de Ingreso */}
            <div className="border-b pb-4">
              <h3 className="font-medium text-gray-800 mb-2">Ingreso</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm">
                    {new Date(`2000-01-01T${asistencia.hora_ingreso}`).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${getEstadoColor(asistencia.estado_ingreso)}`}>
                    {asistencia.estado_ingreso}
                  </span>
                </div>
                <div className="flex items-center">
                  {getNivelSeguridadIcon(asistencia.nivel_seguridad)}
                  <span className="text-sm ml-1">{asistencia.nivel_seguridad}</span>
                </div>
              </div>
            </div>

            {/* Validaciones */}
            <div className="border-b pb-4">
              <h3 className="font-medium text-gray-800 mb-2">Validaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">✓ GPS Validado</span>
                  {asistencia.distancia_ingreso_metros && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({asistencia.distancia_ingreso_metros}m)
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <Wifi className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">
                    {asistencia.wifi_ingreso ? '✓ WiFi Detectado' : '⚠ WiFi No Detectado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Salida */}
            {!asistencia.hora_salida ? (
              <div className="text-center pt-4">
                <button
                  onClick={registrarSalida}
                  disabled={procesando}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {procesando ? 'Procesando...' : 'REGISTRAR SALIDA'}
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <h3 className="font-medium text-gray-800 mb-2">Salida</h3>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm">
                    {new Date(`2000-01-01T${asistencia.hora_salida}`).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="text-sm font-medium text-green-600 ml-4">
                    {asistencia.estado_salida || 'NORMAL'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información de Ubicación Actual */}
      {ubicacion && (
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
          <div className="flex items-center mb-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span>Ubicación Actual</span>
          </div>
          <div>Lat: {ubicacion.latitud.toFixed(6)}</div>
          <div>Lng: {ubicacion.longitud.toFixed(6)}</div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">Información Importante:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Solo puede registrar ingreso y salida una vez por día</li>
              <li>• Debe encontrarse dentro del perímetro de la institución</li>
              <li>• El sistema validará automáticamente su ubicación GPS</li>
              <li>• El registro fuera del horario se marcará como tardanza</li>
              <li>• Mantenga activada la ubicación en su dispositivo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsistenciaPage;