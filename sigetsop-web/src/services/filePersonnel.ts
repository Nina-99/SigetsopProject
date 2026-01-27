import api from "./axiosInstance";

const BASE_URL = "file-personnel/";

interface FileCountResponse {
  count: string;
  result: any[];
}

export const FilePersonnelService = {
  list(params?: any) {
    return api.get(BASE_URL, { params });
  },

  update(id: number, data: any) {
    return api.put(`${BASE_URL}${id}/`, data);
  },

  getTotalCount() {
    return api.get<FileCountResponse>(`${BASE_URL}count_file`);
  },
};

export interface UnitsFile {
  id: number;
  name: string;
  assistant: string;
}
export interface GradeFile {
  id: number;
  grade_abbr: string;
}

export interface PersonnelFile {
  id: number;
  grade_data?: GradeFile | null;
  last_name: string;
  maternal_name: string;
  first_name: string;
  middle_name: string;
  identity_card: string;
  units_data: UnitsFile | null;
  current_destination: string;
}

export interface FilePersonnel {
  id: number;
  has_file: string;
  personnel_data?: PersonnelFile | null;
  personnel?: number | null;
  documents_has: string;
  observation: string;
}

export default FilePersonnel;
