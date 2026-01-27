import api from "./axiosInstance";

const BASE_URL = "natal_data/";

export interface NatalData {
  id: number;
  personnel_data?: {
    id: number;
    first_name: string;
    last_name: string;
    maternal_name?: string;
    identity_card?: string;
  };
  personnel: number;
  relationship_type: "officer" | "civil_partner";
  civil_partner_name?: string;
  birthdate: string;
  country: string;
  department: string;
  province: string;
  locality: string;
  nationality: string;
  observations?: string;
  is_active: boolean;
  registration_date: string;
  updated_at: string;
}

export const natalDataService = {
  list(params?: any) {
    return api.get(BASE_URL, { params });
  },

  retrieve(id: number) {
    return api.get(`${BASE_URL}${id}/`);
  },

  create(data: Partial<NatalData>) {
    return api.post(BASE_URL, data);
  },

  update(id: number, data: Partial<NatalData>) {
    return api.put(`${BASE_URL}${id}/`, data);
  },

  delete(id: number) {
    return api.delete(`${BASE_URL}${id}/`);
  },

  getByPersonnel(personnelId: number, params?: any) {
    return api.get(`${BASE_URL}by_personnel/`, {
      params: { personnel_id: personnelId, ...params },
    });
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
