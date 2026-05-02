import { Celular, Mail, Puntos } from "../../icons";

type Props = {
  puntos: number;
};

export default function SidebarEvento({ puntos }: Props) {
  return (
    <div className="col-span-12 lg:col-span-3 space-y-6 sticky top-6 h-fit">
      <div className="bg-black text-white rounded-2xl p-5 shadow-md w-full max-w-80 relative mx-auto">
        <p className="text-sm text-gray-300" style={{ fontFamily: "Conthrax" }}>
          Puntos disponibles
        </p>
        <div className="flex justify-between mt-2">
          <Puntos className="w-8 h-8 text-gray-800 dark:text-white" />
          <span className="text-2xl font-bold">{puntos} pts</span>
          <span className="text-sm"></span>
        </div>
        <div className="card-accent-canje absolute bottom-0 left-0"></div>
      </div>

      <div className="bg-black rounded-2xl shadow-md overflow-hidden w-full max-w-80 relative mx-auto">
        <h3
          className="font-semibold text-gray-800 text-white  text-center"
          style={{ fontFamily: "Conthrax" }}
        >
          Más recompensas
        </h3>
        {/* Sección Derecha - Redes 
        <img
          src="/images/publicidad/recompensas.jpg"
          className="w-full h-full object-cover"
        />*/}
      </div>
      {/* Sección Derecha - Redes */}
      <div className="right-bottom grid gap-6">
        {/* === Card Redes Sociales === */}
        <div
          className="bg-white dark:bg-gray-900 
                            border border-gray-200 dark:border-gray-700
                            rounded-2xl p-6 
                            shadow-sm hover:shadow-md
                            w-full max-w-80 relative mx-auto  
                            transition-all duration-300"
        >
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
              <img
                src="/images/icons/facebook.svg"
                alt="Facebook"
                className="w-5 h-5 opacity-70 group-hover:opacity-100"
              />
            </a>

            <a
              href="https://www.instagram.com/codialub"
              className="group flex items-center justify-center 
                            w-10 h-10 rounded-xl 
                            bg-gray-100 dark:bg-gray-800 
                            hover:bg-pink-100 dark:hover:bg-pink-900/40
                            transition-all duration-300"
            >
              <img
                src="/images/icons/instagram.svg"
                alt="Instagram"
                className="w-5 h-5 opacity-70 group-hover:opacity-100"
              />
            </a>

            <a
              href="#"
              className="group flex items-center justify-center 
                            w-10 h-10 rounded-xl 
                            bg-gray-100 dark:bg-gray-800 
                            hover:bg-green-100 dark:hover:bg-green-900/40
                            transition-all duration-300"
            >
              <img
                src="/images/icons/web.svg"
                alt="Sitio Web"
                className="w-5 h-5 opacity-70 group-hover:opacity-100"
              />
            </a>
          </div>
        </div>
        {/* === Card Contacto === */}
        <div
          className="bg-white dark:bg-gray-900 
                            border border-gray-200 dark:border-gray-700
                            rounded-2xl p-6 
                            shadow-sm hover:shadow-md
                            w-full max-w-80 relative mx-auto 
                            transition-all duration-300"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Contáctanos
          </h2>

          <div className="space-y-3 text-sm">
            <a
              href="tel:9611234567"
              className="flex items-center gap-3 
                            text-gray-600 dark:text-gray-300
                            hover:text-blue-600 dark:hover:text-blue-400
                            transition-colors duration-200"
            >
              <Celular className="w-4 h-4 text-gray-800 dark:text-white" />
              961 123 4567
            </a>

            <a
              href="mailto:mercadotecnia@codialub.com"
              className="flex items-center gap-3 
                            text-gray-600 dark:text-gray-300
                            hover:text-blue-600 dark:hover:text-blue-400
                            transition-colors duration-200"
            >
              <Mail className="w-4 h-4 text-gray-800 dark:text-white" />
              mercadotecnia@codialub.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
