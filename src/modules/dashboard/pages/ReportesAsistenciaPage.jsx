import React, { useState, useEffect } from 'react';
import { Calendar, Download, Users, Clock, TrendingUp, BarChart3, Filter, Eye } from 'lucide-react';
import api from '../../../services/api';

const ReportesAsistenciaPage = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [reporteDetallado, setReporteDetallado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
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

      const response = await api.get(`/asistencias/admin/reporte?${params.toString()}`, {
        responseType: 'blob'
      });

      // Crear archivo CSV
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes de Asistencia</h1>
          <p className="text-gray-600">Análisis y estadísticas de asistencia docente</p>
        </div>
        <button
          onClick={exportarExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={filtros.fecha_inicio}
              onChange={handleFiltroChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              name="fecha_fin"
              value={filtros.fecha_fin}
              onChange={handleFiltroChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Docente
            </label>
            <select
              name="id_docente"
              value={filtros.id_docente}
              onChange={handleFiltroChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Docentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.estadisticas_generales.total_docentes}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registros Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.estadisticas_generales.total_registros}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">% Puntualidad</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.estadisticas_generales.porcentaje_puntualidad}%
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tardanzas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.estadisticas_generales.tardanzas}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Asistencias por Día */}
      {estadisticas && estadisticas.asistencias_por_dia.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Asistencias por Día (Últimos 7 días)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 font-medium text-gray-700">Fecha</th>
                  <th className="text-left p-2 font-medium text-gray-700">Total</th>
                  <th className="text-left p-2 font-medium text-gray-700">Puntuales</th>
                  <th className="text-left p-2 font-medium text-gray-700">Tardanzas</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.asistencias_por_dia.map((dia, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{formatearFecha(dia.fecha)}</td>
                    <td className="p-2">{dia.total_asistencias}</td>
                    <td className="p-2 text-green-600">{dia.puntuales}</td>
                    <td className="p-2 text-red-600">{dia.tardanzas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reporte Detallado */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Reporte Detallado</h2>
            </div>
            <button
              onClick={() => setMostrarDetalle(!mostrarDetalle)}
              className="text-blue-600 hover:text-blue-800"
            >
              {mostrarDetalle ? 'Ocultar' : 'Mostrar'} Detalle
            </button>
          </div>
        </div>

        {mostrarDetalle && (
          <div className="p-6 overflow-x-auto">
            {reporteDetallado.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros para el período seleccionado
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2 font-medium">Fecha</th>
                    <th className="text-left p-2 font-medium">Docente</th>
                    <th className="text-left p-2 font-medium">DNI</th>
                    <th className="text-left p-2 font-medium">Ingreso</th>
                    <th className="text-left p-2 font-medium">Salida</th>
                    <th className="text-left p-2 font-medium">Estado</th>
                    <th className="text-left p-2 font-medium">Seguridad</th>
                    <th className="text-left p-2 font-medium">Distancia</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteDetallado.map((registro, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-2">{formatearFecha(registro.fecha)}</td>
                      <td className="p-2">
                        {registro.nombres} {registro.apellidos}
                        {registro.area && (
                          <div className="text-xs text-gray-500">{registro.area}</div>
                        )}
                      </td>
                      <td className="p-2">{registro.dni}</td>
                      <td className="p-2">{formatearHora(registro.hora_ingreso)}</td>
                      <td className="p-2">{formatearHora(registro.hora_salida)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(registro.estado_ingreso)}`}>
                          {registro.estado_ingreso}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${getNivelSeguridadColor(registro.nivel_seguridad)}`}>
                          {registro.nivel_seguridad}
                        </span>
                      </td>
                      <td className="p-2">
                        {registro.distancia_ingreso_metros ? `${registro.distancia_ingreso_metros}m` : '-'}
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
  );
};

export default ReportesAsistenciaPage;