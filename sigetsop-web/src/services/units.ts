import api from "./axiosInstance";

const BASE_URL = "police-unit/";

export const UnitsService = {
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

export interface GradeComAss {
  id: number;
  grade_abbr: string;
}

export interface PersonnelComAss {
  id: number;
  grade_data?: GradeComAss | null;
  last_name: string;
  maternal_name: string;
  first_name: string;
  middle_name: string;
  phone: string;
}

export interface Units {
  id: number;
  name: string;
  commander_data?: PersonnelComAss | null;
  assistant_data?: PersonnelComAss[] | null;

  commander?: number | null;
  assistant?: number[] | null;
}

export default Units;
