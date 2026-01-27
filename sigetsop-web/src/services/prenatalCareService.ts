import api from "./axiosInstance";

const BASE_URL = "prenatal_records/";

export interface PrenatalRecord {
  id: number;
  personnel?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  personnel_name?: string;
  personnel_id: number;
  relationship_type: "officer" | "civil_partner";
  civil_partner_name?: string;
  registration_date: string;
  estimated_delivery_date: string;
  current_gestation_week: number;
  rh_factor: string;
  control_location: string;
  observations?: string;
  is_active: boolean;
  updated_at?: string;
}

export const PrenatalCareService = {
  list(params?: any) {
    return api.get(BASE_URL, { params });
  },

  create(data: Partial<PrenatalRecord>) {
    return api.post(BASE_URL, data);
  },

  update(id: number, data: Partial<PrenatalRecord>) {
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
