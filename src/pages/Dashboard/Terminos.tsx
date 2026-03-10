import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const Terminos = () => {
  const [file, setFile] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  useEffect(() => {
    fetch("/legal/TerminosCondiciones.pdf")
      .then((res) => res.blob())
      .then((blob) => setFile(blob))
      .catch((err) => console.error("Error cargando PDF:", err));
  }, []);

  return (
    <div style={{ height: "100vh", overflow: "auto", textAlign: "center" }}>
      {file && (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(error) => console.error("Error PDF:", error)}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <Page key={index} pageNumber={index + 1} width={900} />
          ))}
        </Document>
      )}
    </div>
  );
};

export default Terminos;