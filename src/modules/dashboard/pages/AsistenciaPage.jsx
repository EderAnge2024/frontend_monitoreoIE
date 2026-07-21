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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header con gradiente */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold mb-2">Mi Asistencia</h1>
            <p className="text-blue-100 capitalize text-lg">{fechaActual}</p>
          </div>
        </div>

        {/* Mensajes con mejor estilo */}
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

        {/* Estado Actual con diseño mejorado */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 mb-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Estado Actual
          </h2>
          
          {!asistencia ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Clock className="w-12 h-12 text-gray-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"></div>
              </div>
              <p className="text-gray-600 text-xl mb-8 font-medium">No registrado hoy</p>
              <button
                onClick={registrarIngreso}
                disabled={procesando}
                className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
                      REGISTRAR INGRESO
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información de Ingreso mejorada */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    Ingreso Registrado
                  </h3>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getEstadoColor(asistencia.estado_ingreso)} shadow-md`}>
                    {asistencia.estado_ingreso}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center bg-white/50 rounded-lg p-3">
                    <Clock className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Hora</p>
                      <p className="text-lg font-bold text-gray-800">
                        {new Date(`2000-01-01T${asistencia.hora_ingreso}`).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-white/50 rounded-lg p-3">
                    <Shield className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Seguridad</p>
                      <div className="flex items-center">
                        {getNivelSeguridadIcon(asistencia.nivel_seguridad)}
                        <span className="text-sm font-bold ml-1">{asistencia.nivel_seguridad}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-white/50 rounded-lg p-3">
                    <MapPin className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Distancia</p>
                      <p className="text-sm font-bold text-gray-800">
                        {asistencia.distancia_ingreso_metros ? `${asistencia.distancia_ingreso_metros}m` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validaciones con iconos mejorados */}
              <div className="bg-white/50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-blue-500 mr-2" />
                  Validaciones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-700">GPS Validado (Principal)</p>
                      {asistencia.distancia_ingreso_metros && (
                        <p className="text-xs text-green-600">
                          Distancia: {asistencia.distancia_ingreso_metros}m
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Wifi className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-700">
                        {asistencia.wifi_ingreso && asistencia.wifi_ingreso !== 'No detectado' 
                          ? asistencia.wifi_ingreso
                          : 'WiFi: Informativo'}
                      </p>
                      <p className="text-xs text-blue-600">Complementario</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Salida mejorado */}
              {!asistencia.hora_salida ? (
                <div className="text-center pt-6">
                  <button
                    onClick={registrarSalida}
                    disabled={procesando}
                    className="group relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center">
                      {procesando ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 mr-3" />
                          REGISTRAR SALIDA
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    Salida Registrada
                  </h3>
                  <div className="flex items-center bg-white/50 rounded-lg p-3">
                    <Clock className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-lg font-bold text-gray-800">
                        {new Date(`2000-01-01T${asistencia.hora_salida}`).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        {asistencia.estado_salida || 'NORMAL'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información de Ubicación Actual con estilo */}
        {ubicacion && (
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-sm text-gray-600 mb-6 border border-gray-200 shadow-md">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium">Ubicación GPS Detectada</span>
            </div>
            <div className="ml-8 space-y-1">
              <div>Lat: <span className="font-mono">{ubicacion.latitud.toFixed(6)}</span></div>
              <div>Lng: <span className="font-mono">{ubicacion.longitud.toFixed(6)}</span></div>
            </div>
          </div>
        )}

        {/* Información adicional con mejor diseño */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-md">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-blue-800 mb-3">Información Importante:</p>
              <ul className="text-blue-700 space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <strong>GPS es obligatorio</strong> - Debe estar activado y con buena señal
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  WiFi es informativo - No bloquea el registro si no se detecta
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Un solo registro de ingreso y salida por día
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Debe encontrarse dentro del perímetro de la institución
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  El registro fuera del horario se marcará como tardanza
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estilos CSS personalizados */}
      <style jsx>{`
        @keyframes slide-down {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AsistenciaPage;