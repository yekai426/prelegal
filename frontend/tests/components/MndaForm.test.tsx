import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MndaForm } from "@/components/MndaForm";
import { defaultFormData, type MndaFormData } from "@/lib/types";

// MndaForm is fully controlled (no internal state), so tests render it
// through a small stateful wrapper matching how MndaCreator actually uses it.
function ControlledForm() {
  const [value, setValue] = useState<MndaFormData>(defaultFormData());
  return <MndaForm value={value} onChange={setValue} />;
}

describe("MndaForm", () => {
  it("updates the purpose textarea as the user types", async () => {
    const user = userEvent.setup();
    render(<ControlledForm />);
    const textarea = screen.getByLabelText(/purpose/i);
    await user.clear(textarea);
    await user.type(textarea, "New purpose text");
    expect(textarea).toHaveValue("New purpose text");
  });

  it("disables the MNDA Term duration inputs when Continues is selected", async () => {
    const user = userEvent.setup();
    render(<ControlledForm />);
    const mndaTermGroup = screen.getByRole("group", { name: /mnda term/i });
    const continuesRadio = within(mndaTermGroup).getByRole("radio", {
      name: /continues until terminated/i,
    });

    expect(within(mndaTermGroup).getByRole("spinbutton")).toBeEnabled();
    await user.click(continuesRadio);
    expect(within(mndaTermGroup).getByRole("spinbutton")).toBeDisabled();
  });

  it("re-enables the MNDA Term duration inputs when switching back to Expires", async () => {
    const user = userEvent.setup();
    render(<ControlledForm />);
    const mndaTermGroup = screen.getByRole("group", { name: /mnda term/i });
    await user.click(
      within(mndaTermGroup).getByRole("radio", { name: /continues/i }),
    );
    await user.click(
      within(mndaTermGroup).getByRole("radio", { name: /^expires/i }),
    );
    expect(within(mndaTermGroup).getByRole("spinbutton")).toBeEnabled();
  });

  it("clamps a negative duration entered into the MNDA Term field", () => {
    render(<ControlledForm />);
    const mndaTermGroup = screen.getByRole("group", { name: /mnda term/i });
    const durationInput = within(mndaTermGroup).getByRole("spinbutton");

    fireEvent.change(durationInput, { target: { value: "-5" } });

    expect(durationInput).toHaveValue(1);
  });

  it("clamps a negative duration entered into the Confidentiality Term field", () => {
    render(<ControlledForm />);
    const confidentialityGroup = screen.getByRole("group", {
      name: /term of confidentiality/i,
    });
    const durationInput = within(confidentialityGroup).getByRole("spinbutton");

    fireEvent.change(durationInput, { target: { value: "0" } });

    expect(durationInput).toHaveValue(1);
  });

  it("updates Party 1 fields independently of Party 2", async () => {
    const user = userEvent.setup();
    render(<ControlledForm />);
    const printNameInputs = screen.getAllByLabelText(/print name/i);
    expect(printNameInputs).toHaveLength(2);

    await user.type(printNameInputs[0], "Jane Smith");

    expect(printNameInputs[0]).toHaveValue("Jane Smith");
    expect(printNameInputs[1]).toHaveValue("");
  });
});
