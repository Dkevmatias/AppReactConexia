import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { incidenciaDepositoService } from "../../services/incidenciaDepositoService";

type Props = {
  idIncidenciaDeposito: number;
  alt?: string;
  className?: string;
  fit?: "cover" | "contain";
  onClick?: () => void;
};

export default function FotoDepositoThumb({
  idIncidenciaDeposito,
  alt = "Foto de depósito",
  className = "",
  fit = "cover",
  onClick,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setError(false);
    setUrl(null);

    void (async () => {
      try {
        const blob =
          await incidenciaDepositoService.obtenerArchivoBlob(
            idIncidenciaDeposito,
          );
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [idIncidenciaDeposito]);

  const contenido = error ? (
    <span className="flex h-full w-full items-center justify-center text-gray-400">
      <ImageOff className="h-6 w-6" />
    </span>
  ) : url ? (
    <img
      src={url}
      alt={alt}
      className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin" />
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`overflow-hidden bg-gray-100 dark:bg-gray-700 ${className}`}
      >
        {contenido}
      </button>
    );
  }

  return (
    <div className={`overflow-hidden bg-gray-100 dark:bg-gray-700 ${className}`}>
      {contenido}
    </div>
  );
}
