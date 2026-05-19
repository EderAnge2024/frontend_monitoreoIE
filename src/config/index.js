const config = {
  apiUrl: import.meta.env.VITE_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://bakend-monitoreoie.onrender.com/api'
  ),
  appTitle: 'Sistema de Monitoreo Docente',
  version: '1.0.0'
};

export default config;
