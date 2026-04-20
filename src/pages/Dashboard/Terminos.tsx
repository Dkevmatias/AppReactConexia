const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const Terminos = () => {
  if (isMobile) {
    window.location.href = "/legal/TerminosCondiciones.pdf";
    return null;
  }

  return (
    <iframe
      src="/legal/TerminosCondiciones.pdf"
      width="100%"
      height="100%"
      style={{ border: "none" }}
    />
  );
};
export default Terminos;
