import api from "./axiosInstance";

const BASE_URL = "personnel/";

interface PersonnelCountResponse {
  count: number;
  results: any[];
}

export const PersonnelService = {
  list(params?: any) {
    return api.get(BASE_URL, { params });
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
  search(query: any) {
    return api.get(`${BASE_URL}search/?q=${query}`);
  },

  getTotalCount() {
    return api.get<PersonnelCountResponse>(`${BASE_URL}?limit=1`);
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

export interface UnitsReq {
  id: number;
  name: string;
  assistant: string;
}

export interface GradeReq {
  id: number;
  grade_abbr: string;
}
export interface Personnel {
  id: number;
  grade?: number;
  grade_data?: GradeReq | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  maternal_name: string;
  identity_card: string;
  age?: number;
  birthdate: string | null;
  genre: string;
  phone: string;
  years_age?: number;
  joining_police: string | null;
  scale: string;
  insured_number: string;
  current_destination?: number | null;
  units_data?: UnitsReq | null;
  address: string;
  door_number: string;
  area: string;
  reference: string;
  reference_phone: string;
  is_active?: boolean;
}

export default Personnel;
