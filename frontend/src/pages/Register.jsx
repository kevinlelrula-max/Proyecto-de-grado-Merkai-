import { useState } from "react";
import { toast } from "react-toastify";
import { register } from "../services/api";

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    usuario: "",
    contrasena: "",
    telefono: "",
    direccion: "",
    numero_documento: "",
    rol_id: 2,
    id_municipio: 11001
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    const token = localStorage.getItem("token");

    const res = await register(form, token);

    if (res.id) {
      toast.success("Usuario creado correctamente");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Crear Usuario 👤</h2>

        <input style={styles.input} name="nombre" placeholder="Nombre" onChange={handleChange} />
        <input style={styles.input} name="apellido" placeholder="Apellido" onChange={handleChange} />
        <input style={styles.input} name="usuario" placeholder="Correo" onChange={handleChange} />
        <input style={styles.input} type="password" name="contrasena" placeholder="Contraseña" onChange={handleChange} />
        <input style={styles.input} name="telefono" placeholder="Teléfono" onChange={handleChange} />
        <input style={styles.input} name="direccion" placeholder="Dirección" onChange={handleChange} />
        <input style={styles.input} name="numero_documento" placeholder="Documento" onChange={handleChange} />

        <button style={styles.button} onClick={handleRegister}>
          Registrar
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to right, #22c55e, #0ea5e9)",
  },
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "15px",
    width: "350px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};