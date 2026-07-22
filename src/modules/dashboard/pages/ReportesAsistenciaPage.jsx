import { useState, useEffect } from 'react';
import { Calendar, Download, Users, Clock, TrendingUp, BarChart3, Filter, Eye, Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const ReportesAsistenciaPage = () => {
  const { user } = useAuth();
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

  const eliminarAsistencia = async (id_asistencia) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de asistencia? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/asistencias/${id_asistencia}`);
      cargarDatos();
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
      alert(error.response?.data?.message || 'Error al eliminar el registro');
    }
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden p-6 font-sans pb-12">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header con gradiente mejorado */}
        <div className="text-center mb-10">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/30">
            {/* Brillo decorativo */}
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6 backdrop-blur-md shadow-inner border border-white/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <BarChart3 className="w-10 h-10 animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Reportes de Asistencia</h1>
              <p className="text-blue-100 text-lg md:text-xl font-medium tracking-wide">Análisis y estadísticas de asistencia docente</p>
              
              <button
                onClick={exportarExcel}
                className="mt-8 bg-white/20 backdrop-blur-md text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-3 mx-auto border border-white/30 hover:shadow-xl shadow-lg transform hover:-translate-y-1"
              >
                <Download className="w-6 h-6" />
                Exportar Reporte a Excel
              </button>
            </div>
          </div>
        </div>

        {/* Filtros con diseño moderno */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 p-8 border border-white mb-10 hover:shadow-indigo-500/10 transition-shadow duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Filtros de Búsqueda</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Fecha Inicio</label>
              <input
                type="date"
                name="fecha_inicio"
                value={filtros.fecha_inicio}
                onChange={handleFiltroChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 text-slate-700 font-medium hover:border-blue-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Fecha Fin</label>
              <input
                type="date"
                name="fecha_fin"
                value={filtros.fecha_fin}
                onChange={handleFiltroChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 text-slate-700 font-medium hover:border-blue-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Docente</label>
              <select
                name="id_docente"
                value={filtros.id_docente}
                onChange={handleFiltroChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 text-slate-700 font-medium hover:border-blue-300 appearance-none"
              >
                <option value="">Todos los docentes</option>
                {docentes.map(docente => (
                  <option key={docente.id_docente} value={docente.id_docente}>
                    {docente.nombres} {docente.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pt-2 md:pt-0">
              <button
                onClick={aplicarFiltros}
                className="w-full h-[60px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales con gradientes */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-500/5 p-6 border border-white hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Total Docentes</p>
                  <p className="text-4xl font-black bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.total_docentes}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-green-500/5 p-6 border border-white hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Registros Totales</p>
                  <p className="text-4xl font-black bg-gradient-to-br from-green-500 to-emerald-600 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.total_registros}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-amber-500/5 p-6 border border-white hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">% Puntualidad</p>
                  <p className="text-4xl font-black bg-gradient-to-br from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.porcentaje_puntualidad}%
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Clock className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-red-500/5 p-6 border border-white hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Tardanzas</p>
                  <p className="text-4xl font-black bg-gradient-to-br from-red-500 to-rose-600 bg-clip-text text-transparent">
                    {estadisticas.estadisticas_generales.tardanzas}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
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
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden transition-all duration-500 mb-10">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-white/50">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Reporte Detallado</h2>
            </div>
            <button
              onClick={() => setMostrarDetalle(!mostrarDetalle)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
            >
              {mostrarDetalle ? '▼ Ocultar Detalle' : '▶ Mostrar Detalle'}
            </button>
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
                      <th className={`text-left p-4 font-bold text-gray-800 ${user?.role !== 'director' ? 'rounded-r-xl' : ''}`}>Distancia</th>
                      {user?.role === 'director' && (
                        <th className="text-left p-4 font-bold text-gray-800 rounded-r-xl">Acciones</th>
                      )}
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
                        {user?.role === 'director' && (
                          <td className="p-4">
                            <button
                              onClick={() => eliminarAsistencia(registro.id_asistencia)}
                              className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-all shadow-sm"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        )}
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
