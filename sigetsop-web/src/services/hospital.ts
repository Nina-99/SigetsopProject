import api from "./axiosInstance";

const BASE_URL = "hospitals/";

export const HospitalService = {
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

export interface Hospital {
  id: number;
  name: string;
  phone: string;
}

export default Hospital;
