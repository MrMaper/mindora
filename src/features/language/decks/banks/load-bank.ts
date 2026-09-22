export async function loadBank_general_a2() {
  return (await import("./parts/general_a2")).default;
}

export async function loadBank_general_b1() {
  return (await import("./parts/general_b1")).default;
}

export async function loadBank_general_b2() {
  return (await import("./parts/general_b2")).default;
}

export async function loadBank_academic() {
  return (await import("./parts/academic")).default;
}

export async function loadBank_business() {
  return (await import("./parts/business")).default;
}

export async function loadBank_science() {
  return (await import("./parts/science")).default;
}

export async function loadBank_daily() {
  return (await import("./parts/daily")).default;
}

export async function loadBank_cs() {
  return (await import("./parts/cs")).default;
}

export async function loadBank_ai() {
  return (await import("./parts/ai")).default;
}

export type BankKey = "general_a2" | "general_b1" | "general_b2" | "academic" | "business" | "science" | "daily" | "cs" | "ai";

export async function loadBank(
  key: string,
): Promise<Array<{ front: string; back: string }>> {
  switch (key) {
    case "general_a2":
      return loadBank_general_a2();
    case "general_b1":
      return loadBank_general_b1();
    case "general_b2":
      return loadBank_general_b2();
    case "academic":
      return loadBank_academic();
    case "business":
      return loadBank_business();
    case "science":
      return loadBank_science();
    case "daily":
      return loadBank_daily();
    case "cs":
      return loadBank_cs();
    case "ai":
      return loadBank_ai();
    default:
      return [];
  }
}
