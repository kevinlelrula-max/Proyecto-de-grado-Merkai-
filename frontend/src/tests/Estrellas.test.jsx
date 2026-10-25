import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Estrellas from "../modules/reseñas/components/Estrellas";

describe("Estrellas", () => {
  it("renderiza siempre 5 estrellas", () => {
    render(<Estrellas valor={3} />);
    const estrellas = screen.getAllByText("★");
    expect(estrellas).toHaveLength(5);
  });

  it("no llama onChange si no se pasa la prop (modo solo lectura)", () => {
    render(<Estrellas valor={4} />);
    const estrellas = screen.getAllByText("★");

    fireEvent.click(estrellas[0]);
    // No hay error porque onChange es undefined y se protege con ?.
  });

  it("llama onChange con el número de estrella al hacer click", () => {
    const onChange = vi.fn();
    render(<Estrellas valor={0} onChange={onChange} />);

    const estrellas = screen.getAllByText("★");
    fireEvent.click(estrellas[2]); // 3ª estrella

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("llama onChange con 1 al hacer click en la primera estrella", () => {
    const onChange = vi.fn();
    render(<Estrellas valor={0} onChange={onChange} />);

    const estrellas = screen.getAllByText("★");
    fireEvent.click(estrellas[0]);

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("llama onChange con 5 al hacer click en la última estrella", () => {
    const onChange = vi.fn();
    render(<Estrellas valor={0} onChange={onChange} />);

    const estrellas = screen.getAllByText("★");
    fireEvent.click(estrellas[4]);

    expect(onChange).toHaveBeenCalledWith(5);
  });
});
