import { Building2, Phone, Mail, MapPin, Hash, Clock, MessageCircle, Camera, Globe, Share2 } from "lucide-react";
import { Tarjeta, Campo, Area } from "./ui";
import SubidorLogo from "./SubidorLogo";

const REDES = [
  { key: "whatsapp",  label: "WhatsApp",  Icon: MessageCircle, placeholder: "573001234567", ayuda: "Con indicativo de país, sin + ni espacios." },
  { key: "instagram", label: "Instagram", Icon: Camera,        placeholder: "@minegocio" },
  { key: "facebook",  label: "Facebook",  Icon: Globe,         placeholder: "minegocio" },
];

export default function EmpresaForm({ empresa, logoPreview, errores = {}, onChange, onLogoChange }) {
  const campo = (key) => ({
    id: `emp-${key}`,
    value: empresa[key] || "",
    onChange: (e) => onChange(key, e.target.value),
    error: errores[key],
  });

  return (
    <div className="space-y-5">

      <Tarjeta Icon={Building2} titulo="Identidad" descripcion="Cómo se presenta tu negocio en el panel, los documentos y la tienda en línea">
        <div className="mb-7">
          <SubidorLogo logoPreview={logoPreview} nombre={empresa.nombre} onLogoChange={onLogoChange} />
        </div>

        <div className="space-y-5">
          <Campo {...campo("nombre")} label="Nombre de la empresa" requerido placeholder="Ej.: Pesquera Estrada" />
          <Area
            {...campo("descripcion")}
            label="Descripción del negocio"
            rows={3}
            max={300}
            placeholder="Cuéntales a tus clientes qué vendes y qué te hace diferente."
            ayuda="Se muestra en la portada de tu tienda en línea."
          />
        </div>
      </Tarjeta>

      <Tarjeta Icon={Phone} titulo="Contacto y ubicación" descripcion="Datos que aparecen en tus documentos y en la sección de contacto de la tienda">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Campo {...campo("nit")} label="NIT" Icon={Hash} placeholder="900.123.456-7" />
          <Campo {...campo("telefono")} label="Teléfono" Icon={Phone} type="tel" placeholder="+57 8 785 0000" />
          <Campo {...campo("email")} label="Correo electrónico" Icon={Mail} type="email" placeholder="ventas@empresa.com" className="sm:col-span-2" />
          <Campo {...campo("direccion")} label="Dirección" Icon={MapPin} placeholder="Cra. 5 #12-30, Neiva, Huila" className="sm:col-span-2" />
          <Campo
            {...campo("horario")}
            label="Horario de atención"
            Icon={Clock}
            placeholder="Lunes a sábado, 7:00 a. m. – 6:00 p. m."
            ayuda="Se muestra en la portada y en el contacto de tu tienda."
            className="sm:col-span-2"
          />
        </div>
      </Tarjeta>

      <Tarjeta Icon={Share2} titulo="Redes sociales" descripcion="Aparecen en la sección de contacto de tu tienda">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {REDES.map(({ key, label, Icon, placeholder, ayuda }, i) => (
            <Campo
              key={key}
              {...campo(key)}
              label={label}
              Icon={Icon}
              placeholder={placeholder}
              ayuda={ayuda}
              className={i === 0 ? "sm:col-span-2" : ""}
            />
          ))}
        </div>
      </Tarjeta>

    </div>
  );
}
