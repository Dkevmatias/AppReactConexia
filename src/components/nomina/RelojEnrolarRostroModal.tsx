/* NOMCONEXIA-UNIFY */
import { useEffect, useRef, useState } from "react";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { RelojPersonal, relojService } from "../../services/relojService";

async function blobToVectorBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(hash);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

type Props = {
  open: boolean;
  persona: RelojPersonal | null;
  idEmpresa: number;
  idSucursal: number;
  onClose: () => void;
  onSaved: (mensaje: string) => void;
};

export default function RelojEnrolarRostroModal({
  open,
  persona,
  idEmpresa,
  idSucursal,
  onClose,
  onSaved,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [vector, setVector] = useState("");
  const [camError, setCamError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!open) {
      stopCam();
      setPreview("");
      setVector("");
      setCamError("");
      setError("");
      return;
    }

    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          void video.play();
        }
      })
      .catch(() => {
        if (!cancelled) setCamError("No se pudo abrir la cámara. Puedes subir una foto.");
      });

    return () => {
      cancelled = true;
      stopCam();
    };
  }, [open]);

  const tomarFoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setError("Espera a que la cámara esté lista.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) {
      setError("No se pudo capturar el fotograma.");
      return;
    }
    setPreview(URL.createObjectURL(blob));
    setVector(await blobToVectorBase64(blob));
    setError("");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setVector(await blobToVectorBase64(file));
    setError("");
  };

  const guardar = async () => {
    if (!persona) return;
    if (!vector) {
      setError("Captura o sube una foto del rostro.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await relojService.enrollarPlantilla({
        idPersona: persona.idPersona || null,
        idEmpleado: persona.idEmpleado || null,
        idEmpresa,
        idSucursal,
        vectorCifradoBase64: vector,
        versionModelo: "web-rh-1.0",
      });
      onSaved(
        persona.plantillaVigente
          ? `Plantilla de ${persona.nombre} reemplazada.`
          : `Plantilla de ${persona.nombre} guardada. Ya puede checar cuando tenga celular autorizado.`
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la plantilla");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-xl p-6">
      <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white">Plantilla facial</h3>
      <p className="mb-4 text-sm text-gray-500">
        {persona?.nombre}. La foto solo se usa para confirmar el rostro; al servidor va un vector cifrado, no la
        imagen.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-black dark:border-gray-700">
          <video ref={videoRef} className="h-48 w-full object-cover" playsInline muted autoPlay />
        </div>
        <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
          {preview ? (
            <img src={preview} alt="Captura" className="h-full w-full object-cover" />
          ) : (
            <span className="px-4 text-center text-xs text-gray-500">La captura aparecerá aquí</span>
          )}
        </div>
      </div>

      {camError && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{camError}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={tomarFoto} type="button">
          Tomar foto
        </Button>
        <label className="cursor-pointer text-sm text-blue-600 hover:underline">
          Subir foto
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={saving || !vector}>
          {saving ? "Guardando…" : persona?.plantillaVigente ? "Reemplazar plantilla" : "Guardar plantilla"}
        </Button>
      </div>
    </Modal>
  );
}
