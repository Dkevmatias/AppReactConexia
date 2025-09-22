

import ClientesFP from "../../components/clients/ClientesFP";
import ClientesForm from "../../components/clients/ClientesForm";
import ClientesOE from "../../components/clients/ClientesOE";
export default function Home() {
  return (
    <>
      
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <ClientesForm />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <ClientesFP />
        </div>
        <div className="col-span-12 xl:col-span-7">
          <ClientesOE />
        </div>
        
      </div>
    </>
  );
}
