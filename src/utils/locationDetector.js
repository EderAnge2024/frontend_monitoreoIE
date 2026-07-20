/**
 * Detector de ubicación GPS automático y optimizado
 * Implementa estrategias inteligentes para obtener ubicación rápida y precisa
 */

class LocationDetector {
  constructor() {
    this.cachedLocation = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    this.lastLocationTime = null;
    
    // Configuraciones optimizadas por escenario
    this.configs = {
      highAccuracy: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minuto
      },
      balanced: {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 120000 // 2 minutos
      },
      fast: {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // 5 minutos
      }
    };
  }

  /**
   * Obtener ubicación actual de forma inteligente
   * @param {string} priority - 'accuracy' | 'speed' | 'balanced'
   * @returns {Promise<Object>} Coordenadas GPS
   */
  async getCurrentLocation(priority = 'balanced') {
    try {
      // Verificar si hay ubicación en caché válida
      if (this.isCacheValid() && priority !== 'accuracy') {
        console.log('📍 Usando ubicación en caché');
        return this.cachedLocation;
      }

      // Verificar si geolocalización está disponible
      if (!navigator.geolocation) {
        throw new Error('Geolocalización no soportada en este dispositivo');
      }

      // Intentar obtener ubicación con múltiples estrategias
      const location = await this.getLocationWithFallback(priority);
      
      // Guardar en caché
      this.cacheLocation(location);
      
      return {
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        precision: location.coords.accuracy,
        timestamp: location.timestamp,
        method: 'gps_direct'
      };

    } catch (error) {
      console.warn('Error obteniendo ubicación GPS:', error.message);
      
      // Intentar ubicación aproximada como fallback
      const approximateLocation = await this.getApproximateLocation();
      if (approximateLocation) {
        return approximateLocation;
      }
      
      throw error;
    }
  }

  /**
   * Obtener ubicación con múltiples intentos y fallbacks
   */
  async getLocationWithFallback(priority) {
    const strategies = this.getStrategiesByPriority(priority);
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`📡 Intentando estrategia ${i + 1}: ${strategies[i].name}`);
        const position = await this.getCurrentPositionAsync(strategies[i].config);
        console.log(`✅ Ubicación obtenida con ${strategies[i].name}`);
        return position;
      } catch (error) {
        console.warn(`❌ Falló estrategia ${strategies[i].name}:`, error.message);
        
        // Si es el último intento, lanzar error
        if (i === strategies.length - 1) {
          throw error;
        }
      }
    }
  }

  /**
   * Definir estrategias según prioridad
   */
  getStrategiesByPriority(priority) {
    switch (priority) {
      case 'accuracy':
        return [
          { name: 'Alta Precisión', config: this.configs.highAccuracy },
          { name: 'Balanceado', config: this.configs.balanced },
          { name: 'Rápido', config: this.configs.fast }
        ];
      case 'speed':
        return [
          { name: 'Rápido', config: this.configs.fast },
          { name: 'Balanceado', config: this.configs.balanced }
        ];
      default: // balanced
        return [
          { name: 'Balanceado', config: this.configs.balanced },
          { name: 'Rápido', config: this.configs.fast },
          { name: 'Alta Precisión', config: this.configs.highAccuracy }
        ];
    }
  }

  /**
   * Promisificar getCurrentPosition
   */
  getCurrentPositionAsync(options) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  /**
   * Verificar si el caché es válido
   */
  isCacheValid() {
    if (!this.cachedLocation || !this.lastLocationTime) {
      return false;
    }
    
    const elapsed = Date.now() - this.lastLocationTime;
    return elapsed < this.cacheTimeout;
  }

  /**
   * Guardar ubicación en caché
   */
  cacheLocation(position) {
    this.cachedLocation = {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude,
      precision: position.coords.accuracy,
      timestamp: position.timestamp
    };
    this.lastLocationTime = Date.now();
    
    // Guardar también en localStorage para persistencia
    try {
      localStorage.setItem('location_cache', JSON.stringify({
        location: this.cachedLocation,
        timestamp: this.lastLocationTime
      }));
    } catch (e) {
      console.warn('No se pudo guardar ubicación en localStorage');
    }
  }

  /**
   * Cargar ubicación desde localStorage
   */
  loadCachedLocation() {
    try {
      const cached = localStorage.getItem('location_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const elapsed = Date.now() - data.timestamp;
        
        if (elapsed < this.cacheTimeout) {
          this.cachedLocation = data.location;
          this.lastLocationTime = data.timestamp;
          return true;
        }
      }
    } catch (e) {
      console.warn('Error cargando ubicación del cache');
    }
    return false;
  }

  /**
   * Obtener ubicación aproximada como fallback
   */
  async getApproximateLocation() {
    try {
      // Intentar obtener ubicación por IP (requiere servicio externo)
      const response = await fetch('https://ipapi.co/json/', { 
        timeout: 3000 
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          console.log('📍 Usando ubicación aproximada por IP');
          return {
            latitud: parseFloat(data.latitude),
            longitud: parseFloat(data.longitude),
            precision: 10000, // Baja precisión
            timestamp: Date.now(),
            method: 'ip_geolocation',
            approximate: true
          };
        }
      }
    } catch (error) {
      console.warn('No se pudo obtener ubicación por IP:', error);
    }

    // Fallback final: ubicación predeterminada (Lima, Perú)
    return {
      latitud: -12.0464,
      longitud: -77.0428,
      precision: 50000,
      timestamp: Date.now(),
      method: 'default_fallback',
      approximate: true
    };
  }

  /**
   * Pre-cargar ubicación en segundo plano
   */
  async preloadLocation() {
    try {
      // Cargar desde caché local primero
      this.loadCachedLocation();
      
      // Si no hay caché válido, obtener ubicación en background
      if (!this.isCacheValid()) {
        console.log('🔄 Pre-cargando ubicación en segundo plano...');
        
        // Usar configuración rápida para pre-carga
        const position = await this.getCurrentPositionAsync(this.configs.fast);
        this.cacheLocation(position);
        
        console.log('✅ Ubicación pre-cargada exitosamente');
      }
    } catch (error) {
      console.warn('Pre-carga de ubicación falló:', error.message);
    }
  }

  /**
   * Limpiar caché
   */
  clearCache() {
    this.cachedLocation = null;
    this.lastLocationTime = null;
    try {
      localStorage.removeItem('location_cache');
    } catch (e) {
      console.warn('Error limpiando caché de ubicación');
    }
  }

  /**
   * Obtener estado de la geolocalización
   */
  async getLocationStatus() {
    if (!navigator.geolocation) {
      return { available: false, reason: 'not_supported' };
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return {
        available: true,
        permission: permission.state,
        cached: this.isCacheValid()
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