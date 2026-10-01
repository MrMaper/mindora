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

export async function loadBank_health() {
  return (await import("./parts/health")).default;
}

export async function loadBank_law() {
  return (await import("./parts/law")).default;
}

export async function loadBank_media() {
  return (await import("./parts/media")).default;
}

export async function loadBank_psychology() {
  return (await import("./parts/psychology")).default;
}

export async function loadBank_phrasal() {
  return (await import("./parts/phrasal")).default;
}

export async function loadBank_environment() {
  return (await import("./parts/environment")).default;
}

export type BankKey =
  | "general_a2"
  | "general_b1"
  | "general_b2"
  | "academic"
  | "business"
  | "science"
  | "daily"
  | "cs"
  | "ai"
  | "health"
  | "law"
  | "media"
  | "psychology"
  | "phrasal"
  | "environment";

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
    case "health":
      return loadBank_health();
    case "law":
      return loadBank_law();
    case "media":
      return loadBank_media();
    case "psychology":
      return loadBank_psychology();
    case "phrasal":
      return loadBank_phrasal();
    case "environment":
      return loadBank_environment();
    default:
      return [];
  }
}
