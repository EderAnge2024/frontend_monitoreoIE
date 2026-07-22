import { useState, useEffect } from 'react';
import { 
  MapPin, Wifi, Shield, Settings, Save, RotateCcw, 
  AlertTriangle, CheckCircle, Clock, Radar, Globe,
  Smartphone, Lock, Users, Activity
} from 'lucide-react';
import api from '../../../services/api';
import wifiDetector from '../../../utils/wifiDetector';
import locationDetector from '../../../utils/locationDetector';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los íconos de Leaflet en Vite/React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Componente Switch moderno
const ModernSwitch = ({ enabled, onChange, label, description, icon: Icon }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-all duration-200">
    <div className="flex items-center space-x-3">
      {Icon && <Icon className="w-5 h-5 text-gray-600" />}
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// Componente Slider moderno
const ModernSlider = ({ value, onChange, min = 10, max = 1000, step = 10, label, unit = 'm' }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-blue-600">{value}</span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{min}{unit}</span>
          <span>{Math.floor((min + max) / 4)}{unit}</span>
          <span>{Math.floor((min + max) / 2)}{unit}</span>
          <span>{Math.floor((min + max) * 3/4)}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
};
// Componente para capturar los clics en el mapa
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position}></Marker> : null;
};

// Componente Mapa Interactivo Real
const InteractiveMap = ({ lat, lng, radius, onLocationChange }) => {
  // Si no hay coordenadas, usamos Lima por defecto
  const position = lat && lng ? [lat, lng] : [-12.0464, -77.0428];

  return (
    <div className="relative">
      <div className="w-full h-80 rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative z-0">
        <MapContainer 
          center={position} 
          zoom={16} 
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={(newLat, newLng) => onLocationChange(newLat, newLng)} 
          />
          {lat && lng && radius && (
            <Circle 
              center={position} 
              radius={radius}
              pathOptions={{ fillColor: '#3B82F6', color: '#2563EB', fillOpacity: 0.2 }}
            />
          )}
        </MapContainer>
      </div>
      
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center text-sm text-blue-800 font-medium">
          <Radar className="w-5 h-5 mr-3 text-blue-600 animate-pulse" />
          <span>Radio de validación activo: <strong>{radius}m</strong></span>
        </div>
        <div className="text-xs font-bold text-blue-700 bg-blue-100/80 px-4 py-2 rounded-lg border border-blue-200 shadow-sm flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          Haz clic en el mapa para mover la ubicación
        </div>
      </div>
    </div>
  );
};

// Componente Tarjeta de Nivel de Seguridad
const SecurityLevelCard = ({ level, title, description, icon: Icon, selected, onSelect }) => (
  <div
    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
      selected
        ? 'border-blue-500 bg-blue-50 shadow-lg'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
    }`}
    onClick={onSelect}
  >
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-full ${selected ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <Icon className={`w-6 h-6 ${selected ? 'text-blue-600' : 'text-gray-600'}`} />
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className={`text-sm mt-1 ${selected ? 'text-blue-700' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </div>
  </div>
);
const ConfiguracionAsistenciaPage = () => {
  const [config, setConfig] = useState({
    latitud_ie: -12.0464,
    longitud_ie: -77.0428,
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
  const [securityLevel, setSecurityLevel] = useState('gps');

  // Estados UI
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [detectandoWifi, setDetectandoWifi] = useState(false);

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
          latitud_ie: configData.latitud_ie || -12.0464,
          longitud_ie: configData.longitud_ie || -77.0428,
          radio_permitido_metros: configData.radio_permitido_metros || 100,
          wifi_nombre: configData.wifi_nombre || '',
          wifi_bssid: configData.wifi_bssid || '',
          validar_gps: configData.validar_gps !== false,
          validar_wifi: configData.validar_wifi === true,
          hora_ingreso: configData.hora_ingreso?.slice(0, 5) || '08:00',
          hora_salida: configData.hora_salida?.slice(0, 5) || '13:00',
          tolerancia_minutos: configData.tolerancia_minutos || 15,
          activo: configData.activo !== false
        });
      }
    } catch (error) {
      setError('Error cargando configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat, lng) => {
    setConfig(prev => ({
      ...prev,
      latitud_ie: lat,
      longitud_ie: lng
    }));
    setMensaje('Ubicación actualizada correctamente');
  };

  const obtenerUbicacionActual = async () => {
    setObteniendoUbicacion(true);
    try {
      const location = await locationDetector.getCurrentLocation('highAccuracy');
      handleLocationChange(location.latitud, location.longitud);
    } catch (error) {
      setError('Error obteniendo ubicación GPS');
    } finally {
      setObteniendoUbicacion(false);
    }
  };

  const detectarWifi = async () => {
    setDetectandoWifi(true);
    try {
      const wifiInfo = await wifiDetector.detectWiFi();
      if (wifiInfo.wifi_ssid) {
        setConfig(prev => ({
          ...prev,
          wifi_nombre: wifiInfo.wifi_ssid,
          wifi_bssid: wifiInfo.wifi_bssid || ''
        }));
        setMensaje(`WiFi detectado: ${wifiInfo.wifi_ssid}`);
      }
    } catch (error) {
      setError('No se pudo detectar WiFi');
    } finally {
      setDetectandoWifi(false);
    }
  };
  const guardarConfiguracion = async () => {
    setSaving(true);
    setError('');
    setMensaje('');

    try {
      const configToSave = {
        ...config,
        latitud_ie: parseFloat(config.latitud_ie),
        longitud_ie: parseFloat(config.longitud_ie),
        radio_permitido_metros: parseInt(config.radio_permitido_metros),
        tolerancia_minutos: parseInt(config.tolerancia_minutos)
      };

      await api.post('/asistencias/admin/configuracion', configToSave);
      setMensaje('Configuración guardada exitosamente');
    } catch (error) {
      setError('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const restablecerValores = () => {
    setConfig({
      latitud_ie: -12.0464,
      longitud_ie: -77.0428,
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
    setSecurityLevel('gps');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl shadow-blue-500/10 flex flex-col items-center space-y-4 border border-white">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <span className="text-slate-600 font-medium text-lg">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans pb-12">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-10 sticky top-0 z-20 shadow-sm shadow-slate-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Settings className="w-8 h-8 text-white animate-[spin_4s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Configuración de Asistencia</h1>
              <p className="text-lg text-slate-500 mt-2 font-medium">
                Configure los parámetros de validación para el registro de asistencia docente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}

        {mensaje && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{mensaje}</span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CARD 1: Ubicación Institucional */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white p-8 sm:p-10 hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-blue-100 rounded-xl">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Ubicación Institucional</h2>
            </div>
            
            <InteractiveMap
              lat={config.latitud_ie}
              lng={config.longitud_ie}
              radius={config.radio_permitido_metros}
              onLocationChange={handleLocationChange}
            />
            
            <div className="mt-6 space-y-6">
              <ModernSlider
                value={config.radio_permitido_metros}
                onChange={(value) => setConfig(prev => ({ ...prev, radio_permitido_metros: value }))}
                min={10}
                max={1000}
                step={10}
                label="Radio permitido"
                unit="m"
              />
              
              <button
                onClick={obtenerUbicacionActual}
                disabled={obteniendoUbicacion}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
              >
                <MapPin className="w-5 h-5" />
                <span>{obteniendoUbicacion ? 'Obteniendo ubicación...' : 'Obtener ubicación actual'}</span>
                {obteniendoUbicacion && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />}
              </button>
            </div>
          </div>

          {/* CARD 2: Red WiFi Institucional */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white p-8 sm:p-10 hover:shadow-green-500/10 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-green-100 rounded-xl">
                <Wifi className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Red WiFi Institucional</h2>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800 font-medium">
                    La validación WiFi es opcional y complementaria al GPS
                  </p>
                </div>
              </div>
              
              <ModernSwitch
                enabled={config.validar_wifi}
                onChange={(value) => setConfig(prev => ({ ...prev, validar_wifi: value }))}
                label="Validar red WiFi"
                description="Activar detección de red institucional"
                icon={Wifi}
              />
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Red (SSID)
                  </label>
                  <input
                    type="text"
                    value={config.wifi_nombre}
                    onChange={(e) => setConfig(prev => ({ ...prev, wifi_nombre: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Nombre de la red WiFi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BSSID (MAC Address)
                  </label>
                  <input
                    type="text"
                    value={config.wifi_bssid}
                    onChange={(e) => setConfig(prev => ({ ...prev, wifi_bssid: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="00:11:22:33:44:55"
                  />
                </div>
                
                <button
                  onClick={detectarWifi}
                  disabled={detectandoWifi}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>{detectandoWifi ? 'Detectando...' : 'Detectar WiFi automáticamente'}</span>
                  {detectandoWifi && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
          <button
            onClick={restablecerValores}
            className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-300 font-bold"
          >
            Restablecer Valores
          </button>
          <button
            onClick={guardarConfiguracion}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saving ? 'Guardando Cambios...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionAsistenciaPage;