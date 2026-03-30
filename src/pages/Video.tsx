import { Helmet } from "react-helmet-async";

const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/epo3qzeveJY";

const PAGE_TITLE = "Video";
const PAGE_DESCRIPTION = "Mira el video aquí.";

export default function Video() {
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
        <meta name="twitter:card" content="player" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl space-y-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white text-center">
            {PAGE_TITLE}
          </h1>
          <div className="rounded-xl overflow-hidden shadow-xl bg-black">
            <iframe
              src={YOUTUBE_EMBED_URL}
              title={PAGE_TITLE}
              className="w-full aspect-[9/16] max-h-[80vh] mx-auto"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </>
  );
}
