import { Document, Page, pdfjs } from "react-pdf";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const Terminos = () => {
  return (
    <div style={{ height: "100vh", overflow: "auto", textAlign: "center" }}>
      <Document file="/legal/TerminosCondiciones.pdf">
        <Page pageNumber={1} width={900} />
      </Document>
    </div>
  );
};

export default Terminos;