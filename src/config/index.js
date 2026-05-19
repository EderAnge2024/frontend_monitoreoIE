// Obtener la URL base desde las variables de entorno de Vite
let baseApiUrl = import.meta.env.VITE_API_URL;

if (!baseApiUrl) {
  // En desarrollo local usará este fallback. En producción (Vercel) dependerá obligatoriamente de la variable de entorno.
  baseApiUrl = 'http://localhost:5000/api';
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

