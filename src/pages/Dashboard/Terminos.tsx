import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const Terminos = () => {
  const [file, setFile] = useState<Blob | null>(null);

  useEffect(() => {
    fetch("/legal/TerminosCondiciones.pdf")
      .then((res) => res.blob())
      .then((blob) => setFile(blob))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ height: "100vh", overflow: "auto", textAlign: "center" }}>
      {file && (
        <Document file={file}>
          <Page pageNumber={1} width={900} />
        </Document>
      )}
    </div>
  );
};

export default Terminos;