import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "../modules/inicio/components/StatCard";

describe("StatCard", () => {
  it("muestra el label y el valor correctamente", () => {
    render(<StatCard label="Ventas hoy" valor="$150.000" />);

    expect(screen.getByText("Ventas hoy")).toBeInTheDocument();
    expect(screen.getByText("$150.000")).toBeInTheDocument();
  });

  it("muestra la descripción cuando se pasa como prop", () => {
    render(<StatCard label="Pedidos" valor="12" descripcion="Últimas 24 horas" />);

    expect(screen.getByText("Últimas 24 horas")).toBeInTheDocument();
  });

  it("no muestra descripción si no se pasa la prop", () => {
    render(<StatCard label="Pedidos" valor="12" />);

    expect(screen.queryByText("Últimas 24 horas")).not.toBeInTheDocument();
  });

  it("muestra el punto de alerta cuando alerta es true", () => {
    const { container } = render(
      <StatCard label="Stock" valor="3" alerta={true} />
    );

    const dot = container.querySelector("span[style*='border-radius']");
    expect(dot).toBeTruthy();
  });

  it("aplica color rojo al valor cuando alerta es true", () => {
    render(<StatCard label="Stock" valor="3" alerta={true} />);

    const valor = screen.getByText("3");
    expect(valor).toHaveStyle({ color: "#ef4444" });
  });
});
