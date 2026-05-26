import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  UserSquare, 
  FileText, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  ClipboardCheck,
  ClipboardList,
  Calendar,
  Sun,
  Moon,
  Target,
  FolderOpen
} from 'lucide-react';


const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/alerts');
      setNotifications(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalNotifs = notifications.reduce((acc, curr) => acc + curr.count, 0);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['administrador', 'director', 'especialista', 'docente'] },
    { name: 'Instituciones', icon: <School size={20} />, path: '/instituciones', roles: ['administrador', 'especialista'] },
    { name: 'Usuarios', icon: <Users size={20} />, path: '/usuarios', roles: ['administrador'] },
    { name: 'Periodos Lectivos', icon: <Calendar size={20} />, path: '/periodos', roles: ['administrador'] },
    { name: 'Docentes', icon: <UserSquare size={20} />, path: '/docentes', roles: ['administrador', 'director'] },
    { name: 'Fichas y Preguntas', icon: <Settings size={20} />, path: '/configuracion-fichas', roles: ['administrador'] },
    { name: 'FUTs Institucionales', icon: <FileText size={20} />, path: '/futs', roles: ['administrador', 'director'] },
    { name: 'Niveles de Desempeño', icon: <Target size={20} />, path: '/niveles-desempeno', roles: ['administrador'] },
    { name: 'Realizar Monitoreo', icon: <ClipboardCheck size={20} />, path: '/monitoreo/nuevo', roles: ['administrador', 'director', 'especialista'] },
    { name: 'Historial Monitoreos', icon: <ClipboardList size={20} />, path: '/monitoreo/historial', roles: ['administrador', 'director', 'especialista'] },
    { name: 'Mis Monitoreos', icon: <FileText size={20} />, path: '/mis-monitoreos', roles: ['docente'] },
    { name: 'Trámites / Solicitudes', icon: <FileText size={20} />, path: '/solicitudes', roles: ['administrador', 'director', 'docente'] },
    { name: 'Gestión Documental', icon: <FolderOpen size={20} />, path: '/gestion-documental', roles: ['administrador', 'director', 'docente'] },
    { name: 'Reportes y Estadísticas', icon: <BarChart3 size={20} />, path: '/reportes', roles: ['administrador', 'director', 'especialista'] },
  ];


  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: isSidebarOpen ? '280px' : '80px', 
        backgroundColor: 'var(--surface)', 
        borderRight: '1px solid var(--border)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50
      }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
          {isSidebarOpen && (
            <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
              MONITOREO<span style={{ color: 'var(--text-main)' }}>IE</span>
            </span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--background)', color: 'var(--text-muted)' }}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto', overflowX: 'hidden' }}>
          {filteredMenu.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0.875rem 1rem', 
                marginBottom: '0.5rem',
                borderRadius: 'var(--radius)',
                color: location.pathname === item.path ? 'white' : 'var(--text-muted)',
                backgroundColor: location.pathname === item.path ? 'var(--primary)' : 'transparent',
                gap: '1rem',
                transition: 'all 0.2s',
                boxShadow: location.pathname === item.path ? '0 4px 12px -2px rgba(37, 99, 235, 0.3)' : 'none'
              }}
            >
              {item.icon}
              {isSidebarOpen && <span style={{ fontWeight: '500' }}>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%',
              padding: '0.875rem 1rem', 
              borderRadius: 'var(--radius)',
              color: 'var(--danger)',
              backgroundColor: 'transparent',
              gap: '1rem',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span style={{ fontWeight: '500' }}>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ 
          height: '70px', 
          backgroundColor: 'var(--surface)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 2rem',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              padding: '0.6rem', 
              borderRadius: '0.5rem', 
              color: 'var(--text-muted)', 
              backgroundColor: 'var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              style={{ 
                padding: '0.6rem', 
                borderRadius: '0.5rem', 
                color: 'var(--text-muted)', 
                backgroundColor: 'var(--background)',
                position: 'relative',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Bell size={20} />
              {totalNotifs > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-2px', 
                  right: '-2px', 
                  backgroundColor: 'var(--danger)', 
                  color: 'white', 
                  fontSize: '0.6rem', 
                  fontWeight: '800', 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px var(--surface)'
                }}>
                  {totalNotifs}
                </span>
              )}
            </button>

            {showNotifMenu && totalNotifs > 0 && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                width: '300px',
                backgroundColor: 'var(--surface)',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                border: '1px solid var(--border)',
                padding: '0.75rem',
                zIndex: 100
              }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>Alertas del Sistema</h4>
                {notifications.map((n, i) => (
                  <div key={i} onClick={() => { navigate(n.link); setShowNotifMenu(false); }} style={{ 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: 'var(--background)', 
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    textAlign: 'left'
                  }}>
                    <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {n.title}
                      <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>{n.count}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0', color: 'var(--text-muted)', lineHeight: '1.2' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border)', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>{user?.nombres} {user?.apellidos}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: 0, lineHeight: 1 }}>{user?.role}</p>
              {user?.institucion_nombre && (
                <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '700', margin: '2px 0 0', textTransform: 'uppercase' }}>
                  IE: {user.institucion_nombre}
                </p>
              )}
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary)', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700'
            }}>
              {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
            </div>
          </Link>
        </header>

        {/* Page Content */}
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
