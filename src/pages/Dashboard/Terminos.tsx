import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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