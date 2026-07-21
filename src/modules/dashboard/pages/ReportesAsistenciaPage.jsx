import { useState, useEffect } from 'react';
import { Calendar, Download, Users, Clock, TrendingUp, BarChart3, Filter, Eye } from 'lucide-react';
import api from '../../../services/api';

const ReportesAsistenciaPage = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [reporteDetallado, setReporteDetallado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    id_docente: ''
  });
  const [docentes, setDocentes] = useState([]);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarDocentes();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);

      const [estadisticasRes, reporteRes] = await Promise.all([
        api.get(`/asistencias/admin/estadisticas?${params.toString()}`),
        api.get(`/asistencias/admin/reporte?${params.toString()}`)
      ]);

      setEstadisticas(estadisticasRes.data);
      setReporteDetallado(reporteRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDocentes = async () => {
    try {
      const response = await api.get('/docentes');
      setDocentes(response.data);
    } catch (error) {
      console.error('Error cargando docentes:', error);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const aplicarFiltros = () => {
    cargarDatos();
  };

  const exportarExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.id_docente) params.append('id_docente', filtros.id_docente);

      const csvContent = convertirACSV(reporteDetallado);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_asistencia_${filtros.fecha_inicio}_${filtros.fecha_fin}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exportando reporte:', error);
    }
  };

  const convertirACSV = (data) => {
    const headers = [
      'Fecha', 'Docente', 'DNI', 'Área', 'Grado/Sección', 
      'Hora Ingreso', 'Hora Salida', 'Estado Ingreso', 
      'Nivel Seguridad', 'Distancia (m)', 'WiFi Detectado'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.fecha,
        `"${row.nombres} ${row.apellidos}"`,
        row.dni,
        row.area || '',
        row.grado && row.seccion ? `${row.grado} "${row.seccion}"` : '',
        row.hora_ingreso || '',
        row.hora_salida || '',
        row.estado_ingreso || '',
        row.nivel_seguridad || '',
        row.distancia_ingreso_metros || '',
        row.wifi_ingreso || ''
      ].join(','))
    ];

    return csvRows.join('\n');
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE');
  };

  const formatearHora = (hora) => {
    if (!hora) return '-';
    return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PUNTUAL': return 'bg-green-100 text-green-800';
      case 'TARDANZA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNivelSeguridadColor = (nivel) => {
    switch (nivel) {
      case 'ALTA': return 'bg-green-100 text-green-800';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800';
      case 'BAJA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando reportes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con gradiente mejorado */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 shadow-xl">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <h1 className="text-4xl font-bold mb-3">Reportes de Asistencia</h1>
            <p className="text-blue-100 text-lg">Análisis y estadísticas de asistencia docente</p>
            <button
              onClick={exportarExcel}
              className="mt-6 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 mx-auto border border-white/20 hover:shadow-lg transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Filtros con diseño moderno */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 mb-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Filtros de Búsqueda</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                name="fecha_inicio"
                value={filtros.fecha_inicio}
                onChange={handleFiltroChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Fecha Fin</label>
              <input
                type="date"
                name="fecha_fin"
                value={filtros.fecha_fin}
                onChange={handleFiltroChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Docente</label>
              <select
                name="id_docente"
                value={filtros.id_docente}
                onChange={handleFiltroChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              >
                <option value="">Todos los docentes</option>
                {docentes.map(docente => (
                  <option key={docente.id_docente} value={docente.id_docente}>
                    {docente.nombres} {docente.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={aplicarFiltros}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales con gradientes */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Total Docentes</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.total_docentes}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/80 to-green-50/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Registros Totales</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.total_registros}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/80 to-yellow-50/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">% Puntualidad</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.porcentaje_puntualidad}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Clock className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/80 to-red-50/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Tardanzas</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.tardanzas}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico de Asistencias por Día */}
        {estadisticas && estadisticas.asistencias_por_dia.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 mb-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Asistencias por Día (Últimos 7 días)</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="text-left p-4 font-bold text-gray-800 rounded-l-xl">Fecha</th>
                    <th className="text-left p-4 font-bold text-gray-800">Total</th>
                    <th className="text-left p-4 font-bold text-gray-800">Puntuales</th>
                    <th className="text-left p-4 font-bold text-gray-800 rounded-r-xl">Tardanzas</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticas.asistencias_por_dia.map((dia, index) => (
                    <tr key={index} className="border-t hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                      <td className="p-4 font-medium text-gray-700">{formatearFecha(dia.fecha)}</td>
                      <td className="p-4 text-gray-900 font-semibold">{dia.total_asistencias}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                          {dia.puntuales}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                          {dia.tardanzas}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reporte Detallado */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Reporte Detallado</h2>
              </div>
              <button
                onClick={() => setMostrarDetalle(!mostrarDetalle)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {mostrarDetalle ? '▼ Ocultar' : '▶ Mostrar'} Detalle
              </button>
            </div>
          </div>

          {mostrarDetalle && (
            <div className="p-6 overflow-x-auto">
              {reporteDetallado.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">No hay registros para el período seleccionado</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <th className="text-left p-4 font-bold text-gray-800 rounded-l-xl">Fecha</th>
                      <th className="text-left p-4 font-bold text-gray-800">Docente</th>
                      <th className="text-left p-4 font-bold text-gray-800">DNI</th>
                      <th className="text-left p-4 font-bold text-gray-800">Ingreso</th>
                      <th className="text-left p-4 font-bold text-gray-800">Salida</th>
                      <th className="text-left p-4 font-bold text-gray-800">Estado</th>
                      <th className="text-left p-4 font-bold text-gray-800">Seguridad</th>
                      <th className="text-left p-4 font-bold text-gray-800 rounded-r-xl">Distancia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteDetallado.map((registro, index) => (
                      <tr key={index} className="border-t hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                        <td className="p-4 font-medium text-gray-700">{formatearFecha(registro.fecha)}</td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{registro.nombres} {registro.apellidos}</div>
                          {registro.area && (
                            <div className="text-xs text-gray-500 mt-1">{registro.area}</div>
                          )}
                        </td>
                        <td className="p-4 text-gray-700">{registro.dni}</td>
                        <td className="p-4 text-gray-700 font-medium">{formatearHora(registro.hora_ingreso)}</td>
                        <td className="p-4 text-gray-700 font-medium">{formatearHora(registro.hora_salida)}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(registro.estado_ingreso)}`}>
                            {registro.estado_ingreso}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getNivelSeguridadColor(registro.nivel_seguridad)}`}>
                            {registro.nivel_seguridad}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700 font-medium">
                          {registro.distancia_ingreso_metros ? (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {registro.distancia_ingreso_metros}m
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesAsistenciaPage;
