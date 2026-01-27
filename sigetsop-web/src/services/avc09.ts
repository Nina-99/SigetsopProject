import axios from "axios";
import api from "./axiosInstance";

const BASE_URL = "avc09/";

interface AVC09CountResponse {
  count: number;
  result: any[];
}

interface ExtendedLeavesStats {
  year: number;
  extended_leaves_monthly_count: number[];
}

export const AVC09Service = {
  list() {
    return api.get(BASE_URL);
  },

  create(data: any) {
    return api.post(BASE_URL, data);
  },

  update(id: number, data: any) {
    return api.put(`${BASE_URL}${id}/`, data);
  },

  delete(id: number) {
    console.log("id ", id);
    return api.delete(`${BASE_URL}${id}/`);
  },

  getTotalCount() {
    return api.get<AVC09CountResponse>(`${BASE_URL}?limit=1`);
  },

  getSickLeaveCount() {
    return api.get<AVC09CountResponse>(`${BASE_URL}count_delivery`);
  },

  getStatics(year?: number) {
    const url = year
      ? `${BASE_URL}get_statics?year=${year}`
      : `${BASE_URL}get_statics`;
    return api.get<ExtendedLeavesStats>(url);
  },

  getTopUnits() {
    return api.get<ExtendedLeavesStats>(`${BASE_URL}get_top_units`);
  },

  exportCSV(params?: any) {
    return api.get(`${BASE_URL}export/csv/`, {
      params,
      responseType: "blob",
    });
  },

  exportPDF(params?: any) {
    return api.get(`${BASE_URL}export/pdf/`, {
      params,
      responseType: "blob",
    });
  },

  exportAllJSON(params?: any) {
    return api.get(`${BASE_URL}export/all/`, { params });
  },
};

const API_BASE = import.meta.env.VITE_API_URL;

export interface UnitsAvc09 {
  id: number;
  name: string;
  assistant: string;
}

export interface GradeAvc09 {
  id: number;
  grade_abbr: string;
}

export interface PersonnelAvc09 {
  id: number;
  grade_data?: GradeAvc09 | null;
  last_name: string;
  maternal_name: string;
  first_name: string;
  middle_name: string;
  phone: string;
  units_data: UnitsAvc09 | null;
  current_destination: string;
}

export interface AVC09 {
  id: number;
  personnel_data?: PersonnelAvc09 | null;
  insured_number: string;
  company_name: string;
  employer_number: string;
  type_risk: string;
  isue_date: string;
  from_date: string;
  to_date: string;
  days_incapacity: string;
  hospital: string;
  matricula: string;
  delivery_date: string;
  state: string;

  personnel?: number | null;
}

export const avc09 = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export async function generateQr() {
  return avc09.post("/qr/genearte/");
}

export async function uploadFile(formData: FormData) {
  return avc09.post("/upload09", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function correctImage(payload: {
  id: string;
  points: number[][];
}) {
  return avc09.post("/ocr/correct/", payload);
}

export async function extractFields(payload: { id: string }) {
  return avc09.post("/ocr/extract/", payload);
}

export async function saveRecord(data: any) {
  return avc09.post("/records/", data);
}
