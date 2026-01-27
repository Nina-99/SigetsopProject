// Define la estructura de los puntos de contorno 4x2
export type Points = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

// Define la estructura de los datos extraídos por OCR (claves de ZONES)
export interface OcrData {
  last_name: string | null;
  maternal_name: string | null;
  first_name: string | null;
  insured_number: string | null;
  birthdate: string | null;
  genre: string | null;
  area: string | null;
  address: string | null;
  door_number: string | null;
  location: string | null;
  salary: string | null;
  joining_police: string | null;
  employer_number: string | null;
}
