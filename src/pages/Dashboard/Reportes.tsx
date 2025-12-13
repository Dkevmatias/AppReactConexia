

import PageMeta from "../../components/common/PageMeta";


export default function Reportes() {


  return (
    
 <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
     
      <h1 className="text-3xl font-bold mb-6 text-center">Reportes BI</h1>
      <div>
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Aquí podrás encontrar los reportes de Business Intelligence (BI) relacionados con la venta y selección de boletos. Analiza las tendencias, el comportamiento de los usuarios y otros datos relevantes para tomar decisiones informadas.
            </p>
            </div>
      </div>
      <div>
        
        <iframe title="DesempeñoVendedores" width="1140" height="541.25" src="https://app.powerbi.com/reportEmbed?reportId=bda5487f-0934-45c6-ad97-5f68d2d9e8db&autoAuth=true&ctid=07fe3355-d4a0-47ff-b733-3c675c8595b7" frameBorder={0} allowFullScreen={true}></iframe>
      </div>
          
    </div>
  );
}
