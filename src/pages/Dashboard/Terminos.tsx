const Terminos = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
       <object
        data="/legal/TerminosCondiciones.pdf"
        type="application/pdf"
        width="100%"
        height="100%"
      >
        <a href="/legal/TerminosCondiciones.pdf">
          Descargar PDF
        </a>
      </object>
    </div>
  );
};

export default Terminos;