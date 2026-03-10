const Terminos = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <object
        data="/legal/TerminosCondiciones.pdf"
        type="application/pdf"
        width="100%"
        height="100%"
      >
        <p>
          No se puede mostrar el PDF.  
          <a href="/legal/TerminosCondiciones.pdf" target="_blank" rel="noopener noreferrer">
            Descargar PDF
          </a>
        </p>
      </object>
    </div>
  );
};

export default Terminos;