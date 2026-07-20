import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Wifi, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import api from '../../../services/api';
import wifiDetector from '../../../utils/wifiDetector';
import locationDetector from '../../../utils/locationDetector';

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

  // Obtener ubicación GPS automáticamente (SOLO GPS REAL)
  const obtenerUbicacion = async (priority = 'balanced') => {
    try {
      console.log('🛰️ Obteniendo ubicación GPS real del dispositivo...');
      const location = await locationDetector.getCurrentLocation(priority);
      
      const coords = {
        latitud: location.latitud,
        longitud: location.longitud
      };
      
      setUbicacion(coords);
      console.log('✅ GPS real obtenido:', {
        coords,
        precision: Math.round(location.precision) + 'm',
        method: location.method
      });
      
      return coords;
    } catch (error) {
      console.error('❌ Error obteniendo GPS real:', error);
      
      // Mostrar error específico al usuario
      const errorMessage = `GPS requerido: ${error.message}`;
      throw new Error(errorMessage);
    }
  };

  // Detectar WiFi (informativo solamente - no crítico)
  const detectarWifi = async () => {
    try {
      console.log('📶 Intentando detectar información de WiFi...');
      const wifiInfo = await wifiDetector.detectWiFi();
      const wifiData = {
        wifi_ssid: wifiInfo.wifi_ssid || 'No detectado',
        wifi_bssid: wifiInfo.wifi_bssid
      };
      setWifi(wifiData);
      
      console.log('📶 WiFi detectado (informativo):', {
        ssid: wifiInfo.wifi_ssid,
        method: wifiInfo.detection_method
      });
      
      return wifiData;
    } catch (error) {
      console.warn('⚠️ No se pudo detectar WiFi (no crítico):', error);
      // WiFi falla - continuar sin problema
      const fallbackData = {
        wifi_ssid: 'No detectado',
        wifi_bssid: null
      };
      setWifi(fallbackData);
      return fallbackData;
    }
  };

  // Registrar ingreso
  const registrarIngreso = async () => {
    try {
      setProcesando(true);
      setError('');
      setMensaje('');

      console.log('🚀 Iniciando registro de ingreso automático...');

      // 1. PRIMERO: Obtener ubicación GPS (CRÍTICO)
      const coords = await obtenerUbicacion('balanced');
      
      // 2. SEGUNDO: Intentar detectar WiFi (OPCIONAL)
      const wifiData = await detectarWifi();

      console.log('📊 Datos recopilados:', { 
        gps: coords, 
        wifi: wifiData.wifi_ssid 
      });

      // Enviar registro
      const response = await api.post('/asistencias/ingreso', {
        ...coords,
        ...wifiData
      });

      setAsistencia(response.data.asistencia);
      setMensaje('¡Ingreso registrado correctamente!');

    } catch (error) {
      console.error('❌ Error registrando ingreso:', error);
      
      // Mensajes de error más específicos
      let errorMsg = 'Error registrando ingreso';
      
      if (error.message.includes('GPS') || error.message.includes('ubicación') || error.message.includes('geolocalización')) {
        errorMsg = error.message;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
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

      console.log('🚀 Iniciando registro de salida automático...');

      // Obtener ubicación GPS (rápido, puede usar caché)
      let coords = {};
      try {
        coords = await obtenerUbicacion('speed');
      } catch (e) {
        console.warn('⚠️ No se pudo obtener ubicación para salida, continuando sin GPS');
      }

      // Detectar WiFi automáticamente
      const wifiData = await detectarWifi();

      // Enviar registro
      const response = await api.post('/asistencias/salida', {
        ...coords,
        ...wifiData
      });

      setAsistencia(response.data.asistencia);
      setMensaje('¡Salida registrada correctamente!');

    } catch (error) {
      console.error('❌ Error registrando salida:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error registrando salida';
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
                  <span className="text-sm">✓ GPS Validado (Principal)</span>
                  {asistencia.distancia_ingreso_metros && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({asistencia.distancia_ingreso_metros}m)
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <Wifi className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm">
                    {asistencia.wifi_ingreso && asistencia.wifi_ingreso !== 'No detectado' 
                      ? `📶 ${asistencia.wifi_ingreso}` 
                      : '📶 WiFi: Informativo'}
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
              <li>• <strong>GPS es obligatorio</strong> - Debe estar activado y con buena señal</li>
              <li>• WiFi es informativo - No bloquea el registro si no se detecta</li>
              <li>• Un solo registro de ingreso y salida por día</li>
              <li>• Debe encontrarse dentro del perímetro de la institución</li>
              <li>• El registro fuera del horario se marcará como tardanza</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsistenciaPage;