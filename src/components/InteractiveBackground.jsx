import React, { useEffect, useRef } from 'react';

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Configuración del efecto
    const QUANTITY = 40; // Cantidad de líneas
    const RADIUS = 200; // Radio de órbita más grande
    const TRAIL_LENGTH = 30; // Estela más larga
    let particles = [];
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    // Inicialización de las partículas
    const init = () => {
      canvas.width = width;
      canvas.height = height;
      
      particles = [];
      for (let i = 0; i < QUANTITY; i++) {
        particles.push({
          size: 2 + Math.random() * 3, // Tamaño un poco más grande
          position: { x: mouseX, y: mouseY },
          history: [], // Almacena posiciones previas para la estela
          offset: { x: Math.random() * 100, y: Math.random() * 100 },
          shift: { x: mouseX, y: mouseY },
          speed: 0.01 + Math.random() * 0.03,
          fillColor: `hsl(${Math.random() * 360}, 80%, 60%)`, // Colores vibrantes
          orbit: RADIUS * 0.3 + (RADIUS * 0.7 * Math.random())
        });
      }
    };

    // Ajustar tamaño al redimensionar ventana
    const onWindowResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    // Actualizar posición objetivo del mouse
    const onMouseMove = (event) => {
      targetMouseX = event.clientX;
      targetMouseY = event.clientY;
    };

    // Ciclo de animación
    const loop = () => {
      // Seguimiento suave del mouse
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Limpiar el canvas en cada frame
      context.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Guardar posición actual en el historial
        p.history.push({ x: p.position.x, y: p.position.y });
        if (p.history.length > TRAIL_LENGTH) {
          p.history.shift();
        }

        // Actualizar desplazamiento y órbita
        p.offset.x += p.speed;
        p.offset.y += p.speed;

        p.shift.x += (mouseX - p.shift.x) * p.speed;
        p.shift.y += (mouseY - p.shift.y) * p.speed;

        p.position.x = p.shift.x + Math.cos(i + p.offset.x) * p.orbit;
        p.position.y = p.shift.y + Math.sin(i + p.offset.y) * p.orbit;

        // Dibujar la estela con degradado de opacidad
        if (p.history.length > 1) {
          context.lineCap = 'round';
          context.lineJoin = 'round';
          
          // Dibujamos segmentos individuales para crear el degradado
          for (let j = 0; j < p.history.length - 1; j++) {
            context.beginPath();
            context.lineWidth = p.size * (j / p.history.length); // La punta es más gruesa
            context.strokeStyle = p.fillColor;
            
            // Opacidad progresiva: cola transparente, punta sólida
            context.globalAlpha = (j / p.history.length) * 0.8;
            
            context.moveTo(p.history[j].x, p.history[j].y);
            context.lineTo(p.history[j + 1].x, p.history[j + 1].y);
            context.stroke();
          }

          // Dibujar la conexión final a la posición actual
          context.beginPath();
          context.lineWidth = p.size;
          context.globalAlpha = 0.9;
          context.moveTo(p.history[p.history.length - 1].x, p.history[p.history.length - 1].y);
          context.lineTo(p.position.x, p.position.y);
          context.stroke();

          // Efecto de brillo en la "punta" (cabeza de la línea)
          context.globalAlpha = 1.0;
          context.beginPath();
          context.fillStyle = p.fillColor;
          context.shadowBlur = 15;
          context.shadowColor = p.fillColor;
          context.arc(p.position.x, p.position.y, p.size / 2, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0; // Resetear brillo para los siguientes trazos
        }
      }

      requestAnimationFrame(loop);
    };

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    init();
    loop();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default InteractiveBackground;
