import React from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';

const DataTable = ({ columns, data, onEdit, onDelete, onCreate, title }) => {
  return (
    <div className="card fade-in" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ 
        padding: '1.5rem', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>{title}</h2>
        {onCreate && (
          <button className="btn btn-primary" onClick={onCreate} style={{ gap: '0.5rem' }}>
            <Plus size={18} /> Nuevo Registro
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
              {columns.map((col, idx) => (
                <th key={idx} style={{ 
                  textAlign: 'left', 
                  padding: '1rem 1.5rem', 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  textTransform: 'uppercase', 
                  color: 'var(--text-muted)' 
                }}>
                  {col.header}
                </th>
              ))}
              <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}> Acciones </th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(row)} 
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(row)} 
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
