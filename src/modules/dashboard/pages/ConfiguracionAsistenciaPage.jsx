import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, Clock, Save, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import api from '../../../services/api';

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

  const obtenerUbicacionActual = () => {
    setObteniendoUbicacion(true);
    
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador');
      setObteniendoUbicacion(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setConfig(prev => ({
          ...prev,
          latitud_ie: position.coords.latitude.toFixed(8),
          longitud_ie: position.coords.longitude.toFixed(8)
        }));
        setMensaje('Ubicación obtenida exitosamente');
        setObteniendoUbicacion(false);
      },
      (error) => {
        setError('Error obteniendo ubicación: ' + error.message);
        setObteniendoUbicacion(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Configuración de Asistencia</h1>
        </div>
        <p className="text-gray-600">
          Configure los parámetros de validación para el registro de asistencia docente
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
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

      {/* Formulario */}
      <form onSubmit={guardarConfiguracion} className="space-y-6">
        {/* Ubicación GPS */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Ubicación de la Institución</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitud *
              </label>
              <input
                type="number"
                name="latitud_ie"
                value={config.latitud_ie}
                onChange={handleInputChange}
                step="0.00000001"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="-12.0464000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitud *
              </label>
              <input
                type="number"
                name="longitud_ie"
                value={config.longitud_ie}
                onChange={handleInputChange}
                step="0.00000001"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="-77.0428000"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={obtenerUbicacionActual}
              disabled={obteniendoUbicacion}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {obteniendoUbicacion ? 'Obteniendo...' : 'Obtener Ubicación Actual'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Radio Permitido (metros)
            </label>
            <input
              type="number"
              name="radio_permitido_metros"
              value={config.radio_permitido_metros}
              onChange={handleInputChange}
              min="10"
              max="1000"
              className="w-full md:w-48 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Distancia máxima permitida desde la institución (recomendado: 50-200m)
            </p>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="validar_gps"
                checked={config.validar_gps}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Validar ubicación GPS (recomendado)
              </span>
            </label>
          </div>
        </div>

        {/* Configuración WiFi */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Red WiFi Institucional</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Red (SSID)
              </label>
              <input
                type="text"
                name="wifi_nombre"
                value={config.wifi_nombre}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="IE_NETWORK"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BSSID (MAC Address)
              </label>
              <input
                type="text"
                name="wifi_bssid"
                value={config.wifi_bssid}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00:11:22:33:44:55"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="validar_wifi"
                checked={config.validar_wifi}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Validar red WiFi institucional
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Si está habilitado, se verificará la conexión a la red institucional
            </p>
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Horarios y Tolerancia</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Ingreso
              </label>
              <input
                type="time"
                name="hora_ingreso"
                value={config.hora_ingreso}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Salida
              </label>
              <input
                type="time"
                name="hora_salida"
                value={config.hora_salida}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tolerancia (minutos)
              </label>
              <input
                type="number"
                name="tolerancia_minutos"
                value={config.tolerancia_minutos}
                onChange={handleInputChange}
                min="0"
                max="60"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="activo"
                checked={config.activo}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Configuración activa
              </span>
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracionAsistenciaPage;