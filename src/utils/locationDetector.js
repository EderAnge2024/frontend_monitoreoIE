/**
 * Detector de ubicación GPS real y preciso
 * SOLO usa GPS del dispositivo - NO fallbacks aproximados
 */

class LocationDetector {
  constructor() {
    this.cachedLocation = null;
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutos (más corto para mayor precisión)
    this.lastLocationTime = null;
    
    // Configuraciones optimizadas por escenario
    this.configs = {
      highAccuracy: {
        enableHighAccuracy: true,
        timeout: 20000, // Más tiempo para GPS preciso
        maximumAge: 30000 // 30 segundos máximo
      },
      balanced: {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000 // 1 minuto
      },
      fast: {
        enableHighAccuracy: false, // Usa GPS rápido pero real
        timeout: 8000,
        maximumAge: 120000 // 2 minutos
      }
    };
  }

  /**
   * Obtener ubicación REAL del GPS del dispositivo
   * NO usa fallbacks aproximados
   */
  async getCurrentLocation(priority = 'balanced') {
    try {
      // Verificar disponibilidad de geolocalización
      if (!navigator.geolocation) {
        throw new Error('GPS no disponible en este dispositivo');
      }

      // Verificar permisos de ubicación
      const permission = await this.checkLocationPermission();
      if (permission === 'denied') {
        throw new Error('Permisos de ubicación denegados. Active el GPS en configuración.');
      }

      // Verificar si hay ubicación REAL en caché válida
      if (this.isCacheValid() && priority !== 'highAccuracy') {
        console.log('📍 Usando ubicación GPS en caché');
        return this.cachedLocation;
      }

      // Obtener ubicación REAL del GPS
      console.log(`🛰️ Obteniendo ubicación GPS real (${priority})...`);
      const position = await this.getGPSPosition(priority);
      
      // Validar que la ubicación sea real y precisa
      this.validateGPSAccuracy(position);
      
      const location = {
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        precision: position.coords.accuracy,
        timestamp: position.timestamp,
        method: 'gps_real'
      };

      // Guardar SOLO ubicaciones reales en caché
      this.cacheLocation(location);
      
      return location;

    } catch (error) {
      console.error('❌ Error obteniendo ubicación GPS real:', error.message);
      // NO usar fallbacks - lanzar error para que el usuario sepa que debe activar GPS
      throw new Error(this.getLocationErrorMessage(error));
    }
  }

  /**
   * Obtener posición GPS real del dispositivo
   */
  async getGPSPosition(priority) {
    const config = this.configs[priority];
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Tiempo de espera agotado. Verifique que el GPS esté activado.'));
      }, config.timeout);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(this.parseGeolocationError(error));
        },
        config
      );
    });
  }

  /**
   * Validar que la ubicación GPS sea suficientemente precisa
   */
  validateGPSAccuracy(position) {
    const accuracy = position.coords.accuracy;
    
    // Si la precisión es muy baja (>1000m), considerar como no confiable
    if (accuracy > 1000) {
      throw new Error(`Señal GPS muy débil (precisión: ${Math.round(accuracy)}m). Intente en un lugar con mejor señal.`);
    }

    // Advertir si la precisión es baja pero aceptable
    if (accuracy > 100) {
      console.warn(`⚠️ Precisión GPS baja: ${Math.round(accuracy)}m`);
    }

    console.log(`✅ GPS obtenido con precisión: ${Math.round(accuracy)}m`);
  }

  /**
   * Verificar permisos de ubicación
   */
  async checkLocationPermission() {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state;
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Parsear errores específicos de geolocalización
   */
  parseGeolocationError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Permisos de GPS denegados. Active la ubicación en su navegador.');
      case error.POSITION_UNAVAILABLE:
        return new Error('Señal GPS no disponible. Verifique que esté en un lugar abierto.');
      case error.TIMEOUT:
        return new Error('Tiempo de espera agotado. Intente nuevamente.');
      default:
        return new Error('Error obteniendo GPS: ' + error.message);
    }
  }

  /**
   * Mensaje de error personalizado según el contexto
   */
  getLocationErrorMessage(error) {
    const baseMessage = error.message;
    
    return `${baseMessage}\n\nPara registrar asistencia necesita:\n• Activar GPS/ubicación en su dispositivo\n• Permitir acceso a ubicación en el navegador\n• Estar en un lugar con buena señal GPS`;
  }

  /**
   * Verificar si el caché es válido (más estricto)
   */
  isCacheValid() {
    if (!this.cachedLocation || !this.lastLocationTime) {
      return false;
    }
    
    const elapsed = Date.now() - this.lastLocationTime;
    return elapsed < this.cacheTimeout;
  }

  /**
   * Guardar SOLO ubicaciones reales en caché
   */
  cacheLocation(location) {
    // Solo cachear si es GPS real
    if (location.method !== 'gps_real') {
      return;
    }

    this.cachedLocation = location;
    this.lastLocationTime = Date.now();
    
    // Guardar en localStorage con timestamp
    try {
      localStorage.setItem('gps_cache', JSON.stringify({
        location: this.cachedLocation,
        timestamp: this.lastLocationTime
      }));
    } catch (e) {
      console.warn('No se pudo guardar GPS en localStorage');
    }
  }

  /**
   * Cargar ubicación REAL desde localStorage
   */
  loadCachedLocation() {
    try {
      const cached = localStorage.getItem('gps_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const elapsed = Date.now() - data.timestamp;
        
        // Solo usar caché si es reciente y es GPS real
        if (elapsed < this.cacheTimeout && data.location.method === 'gps_real') {
          this.cachedLocation = data.location;
          this.lastLocationTime = data.timestamp;
          return true;
        }
      }
    } catch (e) {
      console.warn('Error cargando GPS del cache');
    }
    return false;
  }

  /**
   * Pre-cargar ubicación GPS real en segundo plano
   */
  async preloadLocation() {
    try {
      // Cargar desde caché local primero
      this.loadCachedLocation();
      
      // Si no hay caché válido, obtener GPS real
      if (!this.isCacheValid()) {
        console.log('🛰️ Pre-cargando GPS real en segundo plano...');
        
        // Usar configuración rápida para pre-carga, pero GPS real
        const position = await this.getGPSPosition('fast');
        this.validateGPSAccuracy(position);
        
        const location = {
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          precision: position.coords.accuracy,
          timestamp: position.timestamp,
          method: 'gps_real'
        };
        
        this.cacheLocation(location);
        console.log('✅ GPS real pre-cargado exitosamente');
      }
    } catch (error) {
      console.warn('Pre-carga de GPS falló (normal si no hay permisos aún):', error.message);
    }
  }

  /**
   * Limpiar caché
   */
  clearCache() {
    this.cachedLocation = null;
    this.lastLocationTime = null;
    try {
      localStorage.removeItem('gps_cache');
    } catch (e) {
      console.warn('Error limpiando caché de GPS');
    }
  }

  /**
   * Obtener estado del GPS
   */
  async getLocationStatus() {
    if (!navigator.geolocation) {
      return { available: false, reason: 'GPS no soportado' };
    }

    try {
      const permission = await this.checkLocationPermission();
      return {
        available: true,
        permission: permission,
        cached: this.isCacheValid(),
        cache_age: this.lastLocationTime ? Math.round((Date.now() - this.lastLocationTime) / 1000) : null
      };
    } catch (error) {
      return { available: true, permission: 'unknown', cached: this.isCacheValid() };
    }
  }
}

// Instancia singleton
const locationDetector = new LocationDetector();

// Pre-cargar ubicación al inicializar
if (typeof window !== 'undefined') {
  // Pre-cargar después de que se cargue la página
  setTimeout(() => {
    locationDetector.preloadLocation();
  }, 2000);
}

export default locationDetector;