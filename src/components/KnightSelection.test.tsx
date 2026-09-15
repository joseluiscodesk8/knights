import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import KnightSelection from "@/components/KnightSelection";
import { getBronzeKnights } from "@/lib/knights";

describe("KnightSelection", () => {
  it("muestra los 5 caballeros y permite empezar con el seleccionado", () => {
    const knights = getBronzeKnights();
    const onStart = vi.fn();
    render(<KnightSelection knights={knights} onStart={onStart} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    expect(screen.getByText("Pegasus Seiya")).toBeInTheDocument();

    const startButton = screen.getByRole("button", { name: "Empezar" });
    expect(startButton).toBeDisabled();

    fireEvent.click(screen.getByText("Dragon Shiryu"));
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, name: "Dragon Shiryu" })
    );
  });

  it("muestra el botón atrás cuando lo recibe", () => {
    const onBack = vi.fn();
    render(
      <KnightSelection knights={getBronzeKnights()} onStart={vi.fn()} onBack={onBack} />
    );

    fireEvent.click(screen.getByRole("button", { name: /atrás/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});