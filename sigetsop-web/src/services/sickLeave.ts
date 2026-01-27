import api from "./axiosInstance";

const BASE_URL = "sick-leaves/";

export interface SickLeave {
  id: number;
  personnel: number;
  personnel_data?: {
    first_name: string;
    last_name: string;
    maternal_name: string;
    identity_card: string;
    grade_data?: {
      grade_abbr: string;
    };
  };
  classification: string;
  start_date: string;
  end_date: string | null;
  hospital: number;
  hospital_data?: {
    name: string;
  };
  brought_by: string;
  status: number;
  created_at: string;
  deleted_at: string | null;
}

export const SickLeaveService = {
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
    return api.delete(`${BASE_URL}${id}/`);
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

export default SickLeaveService;
