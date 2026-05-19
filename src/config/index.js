// Obtener la URL base desde las variables de entorno o usar el fallback de desarrollo/producción
let baseApiUrl = import.meta.env.VITE_API_URL;

if (!baseApiUrl) {
  baseApiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://bakend-monitoreoie.onrender.com/api';
}

// Asegurar que la URL no tenga una barra inclinada al final
baseApiUrl = baseApiUrl.trim().replace(/\/$/, '');

// Si la URL no termina con '/api', se la añadimos automáticamente.
// Esto soluciona de raíz el error 404 si en Vercel se configuró VITE_API_URL sin el prefijo '/api'.
if (!baseApiUrl.endsWith('/api')) {
  baseApiUrl = `${baseApiUrl}/api`;
}

const config = {
  apiUrl: baseApiUrl,
  appTitle: 'Sistema de Monitoreo Docente',
  version: '1.0.0'
};

export default config;

