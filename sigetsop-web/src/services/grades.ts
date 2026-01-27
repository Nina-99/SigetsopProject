import api from "./axiosInstance";

const BASE_URL = "grades/";

export const GradesService = {
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
};

export interface Grade {
  id: number;
  grade: string;
  grade_abbr: string;
}

export default Grade;
