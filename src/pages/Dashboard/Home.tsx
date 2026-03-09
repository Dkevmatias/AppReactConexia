import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/useAuth";
import { getPersonas,getVentasCLientes,getPeriodoEvaluar } from "../../services/authService";
import { useVenta } from "../../context/VentaContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import '../../components/evento/RewardsPage.css';
import { Celular, Grafic, Logo50A, Mail, Puntos } from '../../icons';
import Button from '../../components/ui/button/Button';

// Definición de tipos
interface CarouselImage {
  id: number;
  src: string;
  alt: string;
}

interface Persona {
  idPersona: number;
  cardCode?: string | null;
}
const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() +
  1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type MenuOption = 'puntos' | 'canjear' | 'historial' | 'terminos' ;
const Home: React.FC = () => {
  // Estados con tipos
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { ventaTotal, ventaMesActual,mesAnterior,mesActual, setMesAnterior, setVentaTotal, setVentaMesActual,setmesActual } = useVenta();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const nombreMes = (fecha: Date) => {
        return fecha.toLocaleString("es-MX", { month: "long" });
      };
  const getRangoMes = (fecha: Date) => {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      return { inicio, fin };
    };
  const getRangoAnual= () => {
  const hoy = new Date();
      return {
        inicio: new Date(2026, 0, 1),
        fin: hoy
      };
    };
  // Datos tipados para el carrusel
  const carouselImages: CarouselImage[] = [
    { id: 1, src: '/images/publicidad/portada.jpeg', alt: 'Aniversario 50 años' },
    { id: 2, src: '/images/publicidad/publicidad.png', alt: 'Productos destacados' },
    //{ id: 3, src: '/images/carousel/carousel-03.png', alt: 'Ofertas especiales' },
    //{ id: 4, src: '/images/carousel/carousel-04.png', alt: 'Ofertas especiales' },
  ];
    //Cargar datos protegidos
    useEffect(() => {
  if (!user) return;

  const cargarDatos = async () => {
    try {
      setLoading(true);

      //Obtener personas
      const personas: Persona[] = await getPersonas(user.idPersona);
      const cardCodes = personas
        .filter(p => p?.cardCode)
        .map(p => p.cardCode)
        .join(",");

      if (!cardCodes) return;

      //Obtener periodo
      const periodo = await getPeriodoEvaluar();
      

      const fechaFin = new Date(periodo.fechaFin);
      const fechaInicio = new Date(periodo.fechaInicio);

      // Nombres de mes
      setmesActual(nombreMes(fechaFin));
      setMesAnterior(nombreMes(new Date(fechaFin.getFullYear(), fechaFin.getMonth() - 1)));

      //Rango mes actual
      const { inicio: inicioMes, fin: finMes } = getRangoMes(fechaFin);
      const { inicio: inicioAnual, fin: finAnual } = getRangoAnual();

      // 4️Año anterior (solo si es para pruebas)
      const inicioPeriodo = new Date(fechaInicio);
      inicioPeriodo.setFullYear(inicioPeriodo.getFullYear() - 1);

      const finPeriodo = new Date(fechaFin);
      finPeriodo.setFullYear(finPeriodo.getFullYear() - 1);

      const inicioMesAnterior = new Date(inicioMes);
      inicioMesAnterior.setFullYear(inicioMesAnterior.getFullYear() - 1);

      const finMesAnterior = new Date(finMes);
      finMesAnterior.setFullYear(finMesAnterior.getFullYear() - 1);
      
  
      console.log("Mes actual:", formatDate(inicioMes), "a", formatDate(finMes));
      console.log("Anual:", formatDate(inicioAnual), "a", formatDate(finAnual));
       
      // Ejecutar en paralelo
      const [ventasPeriodo, ventasMes] = await Promise.all([
        getVentasCLientes(formatDate(inicioAnual), formatDate(finAnual), cardCodes),
        getVentasCLientes(formatDate(inicioMes), formatDate(finMes), cardCodes)
       
      ]);
      console.log("Ventas periodo:", ventasPeriodo);
      console.log("Ventas mes:", ventasMes);
      console.log("CardCodes:", cardCodes);

      const totalPeriodo = ventasPeriodo?.[0]?.totalVentas ?? 0;
      const totalMes = ventasMes?.[0]?.totalVentas ?? 0;

      // Lógica de negocio separada
      const puntosPeriodo = Math.round((totalPeriodo / 1.16) / 5000);
      const puntosMes = Math.round((totalMes / 1.16) / 1000);

      setVentaTotal(puntosPeriodo);
      console.log("Puntos periodo:", puntosPeriodo);
      setVentaMesActual(puntosMes);
      console.log("Puntos mes:", puntosMes);

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error cargando datos", error);
      }
    } finally {
      setLoading(false);
    }
  };

  cargarDatos();
}, [user]);
  
  // Función para cambiar imagen del carrusel con tipo de retorno
  const nextImage = (): void => {
    setCurrentImageIndex((prevIndex: number) => 
      prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevImage = (): void => {
    setCurrentImageIndex((prevIndex: number) => 
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };
  
  // Cambio automático de imagen
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
   

  return (
    <div className="rewards-page">    
       {/* Contenido Principal */}
      <main className="main-content container">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_180px] gap-6">
        {/*COLUMNA IZQUIERDA */}
          <div className="flex flex-col gap-6">
          {/* Sección Card Puntos */}
         
          <div className="left-top
          bg-[url('/images/logo/home-dark.png')]
          dark:bg-[url('/images/logo/home-white.png')]
          bg-no-repeat
          bg-right
          bg-cover
          px-8
          py-8
          rounded-2xl
          overflow-hidden">
              <div className="left-top-header mb-8">
                                    <h2
                    className="font-semibold text-gray-800 dark:text-white/90
                              text-xl sm:text-2xl lg:text-3xl text-left"
                    style={{ fontFamily: "Conthrax" }}
                  >
                    Bienvenido {user?.fullname}
                  </h2>
                  <p className="font-semibold text-gray-800 dark:text-white/90 
                            text-base sm:text-sm xs:text-2xl text-left">
                    Gracias por ser parte de 50 Años de Trabajo, confianza y<br/>
                    crecimiento compartido. Aquí es donde tus compras te <br/>
                    llevan mas lejos.
                  </p>
                </div>
              
               {/* Card Principal  */}
            <div className="stats-cards flex justify-center gap-6 mt-16 max-w-2xl mx-auto">

                  <div className="stat-card month w-80 p-8">
                    <Grafic className="w-5 h-5 text-gray-800 dark:text-white" />
                    <div className="stat-info">
                      <span className="stat-title">Resumen de {mesActual}</span>
                      <span className="stat-value">{ventaMesActual} <small>pts</small></span>
                    </div>
                    <div className="card-accent"></div>
                  </div>

                  <div className="stat-card total w-80 p-8">
                    <Puntos className="w-5 h-5 text-gray-800 dark:text-white" />
                    <div className="stat-info">
                      <span className="stat-title">Puntos acumulados</span>
                      <span className="stat-value">{ventaTotal} <small>pts</small></span>
                    </div>
                    <div className="card-accent"></div>
                  </div>

                </div>

              <div className="flex justify-center mt-4">
                <Button 
                  size="sm"                   
                  disabled={loading}
                >
                  {loading ? "Cargando..." : "Actualizar puntos"}
                </Button>
              </div>         
            
              </div>
       {/* Sección Carrusel */}
              <div className="left-bottom">
            <div className="carousel-container">
              <div className="carousel">
              <button 
                className="carousel-btn prev-btn" 
                onClick={prevImage}
                aria-label="Imagen anterior"
              >
                <FaChevronLeft />
              </button>                
                <div className="carousel-image">
                  <img 
                    src={carouselImages[currentImageIndex].src} 
                    alt={carouselImages[currentImageIndex].alt}
                  />
                  <div className="carousel-indicators">
                    {carouselImages.map((_, index: number) => (
                      <button
                        key={index}
                        className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`Ir a imagen ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>                
                <button 
                  className="carousel-btn next-btn" 
                  onClick={nextImage}
                  aria-label="Siguiente imagen"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div> 
              </div>
          </div>          
              
                  {/* Columna Derecha  */}
          <div className="flex flex-col gap-6">
                {/* Sección Derecha - Portafolio */} 
        <div className="right-top relative w-full rounded-2xl overflow-hidden bg-white flex justify-center">
          <img
            src="/images/logo/portafolio.jpg"
            alt="Portafolio"
            className="max-w-full h-auto"
          />
              
            {/* Sección Derecha - Portafolio */}           
            <div className="absolute top-4 left-4">
            <h2  className="font-semibold text-gray-800 dark:text-white/90 
                            text-base sm:text-sm xs:text-2xl text-left"
                  style={{ fontFamily: "Conthrax" }}>Portafolio</h2>                 
          </div>
             </div>             
                    
                  {/* Sección Derecha - Redes */}  
            <div className="right-bottom grid gap-4">
                  {/* === Card Redes Sociales === */}
            <div className="bg-white dark:bg-gray-900 
                            border border-gray-200 dark:border-gray-700
                            rounded-2xl p-6 
                            shadow-sm hover:shadow-md 
                            transition-all duration-300">

              <h2 className="text-lg font-semibold text-center text-gray-800 dark:text-white mb-4">
                Síguenos
              </h2>

              <div className="flex gap-4 justify-center">

                <a 
                  href="https://www.facebook.com/holacodialub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center 
                            w-10 h-10 rounded-xl 
                            bg-gray-100 dark:bg-gray-800 
                            hover:bg-blue-100 dark:hover:bg-blue-900/40
                            transition-all duration-300"
                >
                  <img src="/images/icons/facebook.svg" 
                      alt="Facebook"
                      className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                </a>

                <a 
                  href="https://www.instagram.com/codialub"
                  className="group flex items-center justify-center 
                            w-10 h-10 rounded-xl 
                            bg-gray-100 dark:bg-gray-800 
                            hover:bg-pink-100 dark:hover:bg-pink-900/40
                            transition-all duration-300"
                >
                  <img src="/images/icons/instagram.svg" 
                      alt="Instagram"
                      className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                </a>

                <a 
                  href="#"
                  className="group flex items-center justify-center 
                            w-10 h-10 rounded-xl 
                            bg-gray-100 dark:bg-gray-800 
                            hover:bg-green-100 dark:hover:bg-green-900/40
                            transition-all duration-300"
                >
                  <img src="/images/icons/web.svg" 
                      alt="Sitio Web"
                      className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                </a>

              </div>
            </div>

            {/* === Card Contacto === */}
            <div className="bg-white dark:bg-gray-900 
                            border border-gray-200 dark:border-gray-700
                            rounded-2xl p-6 
                            shadow-sm hover:shadow-md 
                            transition-all duration-300">

              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Contáctanos
              </h2>

              <div className="space-y-3 text-sm">

                <a 
                className="flex items-center gap-3 
                            text-gray-600 dark:text-gray-300
                            hover:text-blue-600 dark:hover:text-blue-400
                            transition-colors duration-200"
                >
                  <Celular className="w-4 h-4 text-gray-800 dark:text-white" />
                  961 123 4567
                </a>

                          <a
                  className="flex items-center gap-3 min-w-0
                            text-gray-600 dark:text-gray-300
                            hover:text-blue-600 dark:hover:text-blue-400
                            transition-colors duration-200"
                >
                  <Mail className="w-4 h-4 text-gray-800 dark:text-white flex-shrink-0" />

                  <span className="break-all">
                    mercadotecnia@codialub.com
                  </span>
                </a>

              </div>
            </div>
              </div>
            </div> 
        </div>              
      </main>
      
      <footer className="mt-6 w-full">
          <img
        src="/images/page/meta.png"
        alt="Codialub"
            className="w-full h-auto object-cover"
      />        
      </footer>
    </div>
  );
};

export default Home;