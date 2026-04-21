const Terminos = () => {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    window.location.href = "/legal/TerminosCondiciones.pdf";
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="/legal/TerminosCondiciones.pdf"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
};

export default Terminos;
