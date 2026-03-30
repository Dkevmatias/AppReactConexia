import { Helmet } from "react-helmet-async";

/**
 * ID del Short (la parte final de la URL):
 * https://www.youtube.com/shorts/XXXXXXXXXXX  →  XXXXXXXXXXX
 * También puedes definir VITE_YOUTUBE_VIDEO_ID en .env
 */
const DEFAULT_VIDEO_ID = "epo3qzeveJY";

function getYoutubeId(): string {
  const fromEnv = import.meta.env.VITE_YOUTUBE_VIDEO_ID?.trim();
  return fromEnv || DEFAULT_VIDEO_ID;
}

const PAGE_TITLE = "Video";
const PAGE_DESCRIPTION = "Mira el video aquí.";

export default function Video() {
  const videoId = getYoutubeId();
  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&playsinline=1`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const origin =
    import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? window.location.origin;
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
        <meta property="og:image" content={thumbnailUrl} />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="720" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={thumbnailUrl} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white text-center">
            {PAGE_TITLE}
          </h1>
          <div className="rounded-xl overflow-hidden shadow-xl bg-black">
            <iframe
              src={embedUrl}
              title={PAGE_TITLE}
              className="w-full aspect-[9/16] max-h-[80vh] mx-auto border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Short de YouTube embebido en tu dominio
          </p>
        </div>
      </div>
    </>
  );
}
