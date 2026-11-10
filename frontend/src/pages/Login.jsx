import { useState } from "react";
import { toast } from "react-toastify";
import { loginEmpresa } from "../services/api";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleLogin = async () => {
    
    const res = await loginEmpresa({ usuario, contrasena });
    if (res.token) {
      localStorage.setItem("token", res.token);
      toast.success("Login exitoso");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* 🔥 CARD */}
      <div style={styles.card}>
        
        <h2 style={styles.title}>Bienvenido 👋</h2>
        <p style={styles.subtitle}>
          Inicia sesión en Merkai
        </p>

        {/* INPUT USUARIO */}
        <input
          style={styles.input}
          placeholder="Correo o usuario"
          onChange={(e) => setUsuario(e.target.value)}
        />

        {/* INPUT PASSWORD */}
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setContrasena(e.target.value)}
        />

        {/* BOTÓN */}
        <button style={styles.button} onClick={handleLogin}>
          Ingresar
        </button>

        {/* EXTRA */}
        <p style={styles.extra}>
          ¿No tienes cuenta? <span style={styles.link}>Regístrate</span>
        </p>

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
    background: "linear-gradient(to right, #0ea5e9, #22c55e)",
  },

  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "15px",
    width: "320px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    textAlign: "center",
  },

  title: {
    marginBottom: "10px",
  },

  subtitle: {
    marginBottom: "25px",
    color: "gray",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none",
    fontSize: "14px",
  },

  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#0ea5e9",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
  },

  extra: {
    marginTop: "15px",
    fontSize: "14px",
  },

  link: {
    color: "#0ea5e9",
    cursor: "pointer",
    fontWeight: "bold",
  },
};