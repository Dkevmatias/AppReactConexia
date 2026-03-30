import { Helmet } from "react-helmet-async";

/** Nombre del archivo dentro de public/video/ (ej: promo.mp4) */
//Pondre el video en el backend por el peso del tamaño
const VIDEO_FILENAME = "50Codialub.mp4";

/** Título opcional para la pestaña y para WhatsApp */
const PAGE_TITLE = "Video";
const PAGE_DESCRIPTION = "Mira el video aquí.";

export default function Video() {
  const origin =
    import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? window.location.origin;
  const videoPath = `/video/${VIDEO_FILENAME}`;
  const videoAbsolute = `${origin}${videoPath}`;
  const pageUrl = `${origin}/video`;

  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:video" content={videoAbsolute} />
        <meta property="og:video:type" content="video/mp4" />
        <meta property="og:video:secure_url" content={videoAbsolute} />
        <meta name="twitter:card" content="player" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl space-y-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white text-center">
            {PAGE_TITLE}
          </h1>
          <div className="rounded-xl overflow-hidden shadow-xl bg-black">
            <video
              className="w-full aspect-video"
              controls
              playsInline
              preload="metadata"
              poster={`/video/poster.jpg`}
            >
              <source src={videoPath} type="video/mp4" />
              Tu navegador no reproduce video HTML5. Prueba con otro navegador o
              descarga el archivo.
            </video>
          </div>
        </div>
      </div>
    </>
  );
}
