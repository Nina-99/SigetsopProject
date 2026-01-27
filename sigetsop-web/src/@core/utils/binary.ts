export function textToBinary(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text); // Uint8Array (UTF-8)
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, "0"))
    .join(" ");
}

export function binaryToText(binary: string): string {
  // acepta espacios; toma grupos de 8 bits
  const bits = binary.replace(/\s+/g, " ").trim();
  if (!bits) return "";
  const bytes = bits.split(" ").map((b) => parseInt(b, 2));
  // const decoder = new TextDecoder();
  return new TextDecoder("UTF-8").decode(new Uint8Array(bytes));
}
