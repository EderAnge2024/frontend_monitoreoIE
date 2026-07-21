import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, Clock, Save, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import api from '../../../services/api';
import wifiDetector from '../../../utils/wifiDetector';
import locationDetector from '../../../utils/locationDetector';

const ConfiguracionAsistenciaPage = () => {
  const [config, setConfig] = useState({
    latitud_ie: '',
    longitud_ie: '',
    radio_permitido_metros: 100,
    wifi_nombre: '',
    wifi_bssid: '',
    validar_gps: true,
    validar_wifi: false,
    hora_ingreso: '08:00',
    hora_salida: '13:00',
    tolerancia_minutos: 15,
    activo: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [detectandoWifi, setDetectandoWifi] = useState(false);

  // Cargar configuración existente
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await api.get('/asistencias/admin/configuracion');
      
      if (response.data.exists) {
        const configData = response.data.config;
        setConfig({
          latitud_ie: configData.latitud_ie || '',
          longitud_ie: configData.longitud_ie || '',
          radio_permitido_metros: configData.radio_permitido_metros || 100,
          wifi_nombre: configData.wifi_nombre || '',
          wifi_bssid: configData.wifi_bssid || '',
          validar_gps: configData.validar_gps !== false,
          validar_wifi: configData.validar_wifi === true,
          hora_ingreso: configData.hora_ingreso ? configData.hora_ingreso.slice(0, 5) : '08:00',
          hora_salida: configData.hora_salida ? configData.hora_salida.slice(0, 5) : '13:00',
          tolerancia_minutos: configData.tolerancia_minutos || 15,
          activo: configData.activo !== false
        });
      } else {
        // Usar configuración por defecto
        setConfig(response.data.default_config);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setError('Error cargando configuración de asistencia');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const obtenerUbicacionActual = async () => {
    setObteniendoUbicacion(true);
    
    try {
      console.log('🛰️ Obteniendo ubicación GPS real de la institución...');
      const location = await locationDetector.getCurrentLocation('highAccuracy');
      
      setConfig(prev => ({
        ...prev,
        latitud_ie: location.latitud.toFixed(8),
        longitud_ie: location.longitud.toFixed(8)
      }));
      
      setMensaje(`Ubicación GPS real obtenida exitosamente (Precisión: ${Math.round(location.precision)}m)`);
    } catch (error) {
      console.error('Error obteniendo GPS real:', error);
      setError('GPS requerido: ' + error.message + '\n\nPara configurar la ubicación de la institución necesita activar el GPS y estar físicamente en las instalaciones de la institución.');
    } finally {
      setObteniendoUbicacion(false);
    }
  };

  const detectarWifiAutomaticamente = async () => {
    setDetectandoWifi(true);
    
    try {
      const wifiInfo = await wifiDetector.detectWiFi();
      
      if (wifiInfo.wifi_ssid) {
        setConfig(prev => ({
          ...prev,
          wifi_nombre: wifiInfo.wifi_ssid,
          wifi_bssid: wifiInfo.wifi_bssid || ''
        }));
        
        setMensaje(`WiFi detectado: ${wifiInfo.wifi_ssid} (Método: ${wifiInfo.detection_method})`);
      } else {
        setError('No se pudo detectar información de WiFi automáticamente');
      }
    } catch (error) {
      setError('Error detectando WiFi: ' + error.message);
    } finally {
      setDetectandoWifi(false);
    }
  };

  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setMensaje('');

      const configToSave = {
        ...config,
        latitud_ie: parseFloat(config.latitud_ie),
        longitud_ie: parseFloat(config.longitud_ie),
        radio_permitido_metros: parseInt(config.radio_permitido_metros),
        tolerancia_minutos: parseInt(config.tolerancia_minutos)
      };

      const response = await api.post('/asistencias/admin/configuracion', configToSave);
      
      setMensaje('Configuración guardada exitosamente');
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setError(error.response?.data?.message || 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl p-6 shadow-xl">
            <Settings className="w-12 h-12 mx-auto mb-4 animate-spin-slow" />
            <h1 className="text-3xl font-bold mb-2">Configuración de Asistencia</h1>
            <p className="text-amber-100">
              Configure los parámetros de validación para el registro de asistencia docente
            </p>
          </div>
        </div>

        {/* Mensajes mejorados */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-md animate-slide-down">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3 animate-bounce" />
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

        {/* Formulario mejorado */}
        <form onSubmit={guardarConfiguracion} className="space-y-8">
          {/* Ubicación GPS */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Ubicación de la Institución</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Latitud *
                </label>
                <input
                  type="number"
                  name="latitud_ie"
                  value={config.latitud_ie}
                  onChange={handleInputChange}
                  step="0.00000001"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="-12.0464000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Longitud *
                </label>
                <input
                  type="number"
                  name="longitud_ie"
                  value={config.longitud_ie}
                  onChange={handleInputChange}
                  step="0.00000001"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="-77.0428000"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={obtenerUbicacionActual}
                disabled={obteniendoUbicacion}
                className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <MapPin className="w-5 h-5" />
                {obteniendoUbicacion ? 'Obteniendo GPS...' : 'Obtener Ubicación Actual'}
                {obteniendoUbicacion && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Radio Permitido (metros)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="radio_permitido_metros"
                  value={config.radio_permitido_metros}
                  onChange={handleInputChange}
                  min="10"
                  max="1000"
                  className="w-full md:w-48 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <span className="absolute right-3 top-3 text-gray-500 font-medium">m</span>
              </div>
              <p className="text-sm text-gray-500 mt-2 bg-blue-50 p-3 rounded-lg">
                💡 Distancia máxima permitida desde la institución (recomendado: 50-200m)
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="validar_gps"
                  checked={config.validar_gps}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-3"
                />
                <div>
                  <span className="text-sm font-bold text-gray-700">
                    Validar ubicación GPS (recomendado)
                  </span>
                  <p className="text-xs text-blue-600 mt-1">Activar validación obligatoria de GPS para registros</p>
                </div>
              </label>
            </div>
          </div>

          {/* Configuración WiFi mejorada */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-teal-500 p-3 rounded-xl shadow-lg">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Red WiFi Institucional (Opcional)</h2>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-sm font-medium text-yellow-800">
                  <strong>Nota:</strong> La validación WiFi es opcional y complementaria. 
                  El GPS es la validación principal para registro de asistencia.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre de Red (SSID)
                </label>
                <input
                  type="text"
                  name="wifi_nombre"
                  value={config.wifi_nombre}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="IE_NETWORK"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  BSSID (MAC Address)
                </label>
                <input
                  type="text"
                  name="wifi_bssid"
                  value={config.wifi_bssid}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="00:11:22:33:44:55"
                />
              </div>
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={detectarWifiAutomaticamente}
                disabled={detectandoWifi}
                className="group relative bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-teal-700 disabled:opacity-50 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Wifi className="w-5 h-5" />
                {detectandoWifi ? 'Detectando...' : 'Detectar WiFi Automáticamente'}
                {detectandoWifi && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2 bg-green-50 p-3 rounded-lg">
                🔍 Intenta detectar automáticamente la red WiFi actual del dispositivo
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="validar_wifi"
                  checked={config.validar_wifi}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                />
                <div>
                  <span className="text-sm font-bold text-gray-700">
                    Validar red WiFi institucional (opcional)
                  </span>
                  <p className="text-xs text-green-600 mt-1">
                    Si está habilitado, registrará información de WiFi pero NO bloqueará el registro si no coincide
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Horarios mejorados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Horarios y Tolerancia</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hora de Ingreso
                </label>
                <input
                  type="time"
                  name="hora_ingreso"
                  value={config.hora_ingreso}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hora de Salida
                </label>
                <input
                  type="time"
                  name="hora_salida"
                  value={config.hora_salida}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tolerancia (minutos)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="tolerancia_minutos"
                    value={config.tolerancia_minutos}
                    onChange={handleInputChange}
                    min="0"
                    max="60"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <span className="absolute right-3 top-3 text-gray-500 font-medium">min</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="activo"
                  checked={config.activo}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3"
                />
                <div>
                  <span className="text-sm font-bold text-gray-700">
                    Configuración activa
                  </span>
                  <p className="text-xs text-purple-600 mt-1">Habilitar validaciones de asistencia</p>
                </div>
              </label>
            </div>
          </div>

          {/* Botón de guardar mejorado */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={saving}
              className="group relative bg-gradient-to-r from-amber-600 to-orange-600 text-white px-12 py-4 rounded-2xl hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Guardando Configuración...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6 mr-3" />
                    Guardar Configuración
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
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
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ConfiguracionAsistenciaPage;