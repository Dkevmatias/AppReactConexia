import { Helmet } from "react-helmet-async";
import { FaYoutube, FaPlay } from "react-icons/fa";

const YOUTUBE_VIDEO_ID = "epo3qzeveJY";
const YOUTUBE_THUMBNAIL = `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`;
const YOUTUBE_SHORT_URL = `https://youtube.com/shorts/${YOUTUBE_VIDEO_ID}`;

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
        <meta property="og:image" content={YOUTUBE_THUMBNAIL} />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="720" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={YOUTUBE_THUMBNAIL} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white text-center">
            {PAGE_TITLE}
          </h1>
          <div className="relative rounded-xl overflow-hidden shadow-xl bg-black group cursor-pointer" onClick={() => window.open(YOUTUBE_SHORT_URL, '_blank')}>
            <img
              src={YOUTUBE_THUMBNAIL}
              alt={PAGE_TITLE}
              className="w-full aspect-[9/16] object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FaPlay className="text-white text-2xl ml-1" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <FaYoutube className="text-red-500" />
              <span>YouTube</span>
            </div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Toca la imagen para ver el video en YouTube
          </p>
        </div>
      </div>
    </>
  );
}
