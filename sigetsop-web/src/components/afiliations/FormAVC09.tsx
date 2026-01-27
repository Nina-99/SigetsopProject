import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./FormAVC09.css";
import { Button, PersonnelModal } from "../ui";
import { AVC09Service, Personnel, PersonnelService } from "../../services";

interface IncapacityData {
  LastName: string;
  MaternalName: string;
  FirstName: string;
  MiddleName: string;
  InsuredNumber: string;
  CompanyName: string;
  EmployerNumber: string;
  TypeRisk: string;
  IsueDate: string;
  FromDate: string;
  ToDate: string;
  DaysIncapacity: string;
  Doctor: string;
  Hospital: string;
  Matricula: string;
  State: string;
}

interface PersonnelInitialData {
  first_name: string;
  last_name: string;
  maternal_name: string;
  insured_number: string;
}

interface LocationState {
  data: IncapacityData;
}

const FormAVC09: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<Personnel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(
    null,
  );

  const [formData, setFormData] = useState<IncapacityData | null>(null);

  const [initialModalData, setInitialModalData] =
    useState<PersonnelInitialData | null>(null);

  useEffect(() => {
    const state = location.state as LocationState | null;
    const normalizeKeys = (data: any): IncapacityData => ({
      LastName: data.LastName ?? data.last_name ?? "",
      MaternalName: data.MaternalName ?? data.maternal_name ?? "",
      FirstName: data.FirstName ?? data.first_name ?? "",
      MiddleName: data.MiddleName ?? data.middle_name ?? "",
      InsuredNumber: data.InsuredNumber ?? data.insured_number ?? "",
      CompanyName: data.CompanyName ?? data.company_name ?? "",
      EmployerNumber: data.EmployerNumber ?? data.employer_number ?? "",
      TypeRisk: data.TypeRisk ?? data.type_risk ?? "",
      IsueDate: data.IsueDate ?? data.isue_date ?? "",
      FromDate: data.FromDate ?? data.from_date ?? "",
      ToDate: data.ToDate ?? data.to_date ?? "",
      DaysIncapacity: data.DaysIncapacity ?? data.days_incapacity ?? "",
      Doctor: data.Doctor ?? data.doctor ?? "",
      Hospital: data.Hospital ?? data.hospital ?? "",
      Matricula: data.Matricula ?? data.matricula ?? "",
      State: "ENTREGAR",
    });
    const received = state?.data;

    if (received) {
      const normalized = normalizeKeys(received);
      localStorage.setItem("avc09_data", JSON.stringify(normalized));
      setFormData(normalized);
    } else {
      const savedStorage = localStorage.getItem("avc09_data");
      if (savedStorage) {
        const parsedData = JSON.parse(savedStorage);
        setFormData(parsedData);
      }
    }
  }, [location.state]);

  const onCancel = () => {
    localStorage.removeItem("avc09_data");
    navigate("/");
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof IncapacityData,
  ) => {
    const { value } = event.target;

    setFormData((prev) => {
      if (!prev) {
        return null;
      }

      const newFormData: IncapacityData = {
        ...prev,
        [field]: value.toUpperCase(),
      } as IncapacityData;

      localStorage.setItem("avc09_data", JSON.stringify(newFormData));

      return newFormData;
    });
  };

  const renderInput = (label: string, field: keyof IncapacityData) => (
    <div className="input-group">
      <label>{label}</label>
      <input
        value={formData?.[field] ?? ""}
        onChange={(e) => handleChange(e, field)}
        style={{ textTransform: "uppercase" }}
      />
    </div>
  );
  const renderSignature = (label: string, value: string) => (
    <div className="signature-group">
      <span>{label}</span>
      <label>{value}</label>
    </div>
  );

  const isValidDate = (dateStr: string, format: "YMD" | "DMY"): boolean => {
    if (!dateStr) return false;

    let day: number, month: number, year: number;

    try {
      if (format === "YMD") {
        // YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
        [year, month, day] = dateStr.split("-").map(Number);
      } else {
        // DD-MM-YYYY
        if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return false;
        [day, month, year] = dateStr.split("-").map(Number);
      }

      const date = new Date(year, month - 1, day);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    } catch {
      return false;
    }
  };

  const showDateError = (fieldName: string, expectedFormat: string) => {
    Swal.fire({
      icon: "error",
      title: "Fecha inválida",
      html: `
      <strong>${fieldName}</strong><br/>
      Formato esperado: <code>${expectedFormat}</code>
    `,
      confirmButtonText: "Corregir",
    });
  };

  function convertToISO(dateStr: string) {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  }

  function extractISODate(str: string) {
    const match = str.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  const extractAndValidateIssueDate = (value: string): string | null => {
    if (!value) return null;

    // Busca YYYY-MM-DD dentro del texto
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return null;

    const [year, month, day] = match[0].split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Validación real de fecha
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return match[0]; // YYYY-MM-DD
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPersonnelToEdit(null);
    setInitialModalData(null);
  };

  const handleSavePersonnel = (savedPersonnel: Personnel) => {
    handleModalClose();
    if (personnelToEdit) {
      setData(
        data.map((u) => (u.id === savedPersonnel.id ? savedPersonnel : u)),
      );
    } else {
      setData([savedPersonnel, ...data]);
    }
    if (savedPersonnel.id) {
      createAffiliation(savedPersonnel.id);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error de Creación",
        text: "El nuevo personal fue creado, pero no se pudo obtener su ID para guardar el AVC-09.",
      });
    }
  };

  const createAffiliation = async (personnelId: number) => {
    if (!formData) return;
    console.log("personnelId", personnelId);
    try {
      const payload = {
        personnel: personnelId,
        insured_number: formData.InsuredNumber.toUpperCase(),
        employer_number: formData.EmployerNumber.toUpperCase(),
        type_risk: formData.TypeRisk.toUpperCase(),
        // isue_date: extractISODate(formData.IsueDate.toUpperCase()),
        isue_date: extractAndValidateIssueDate(formData.IsueDate),

        from_date: convertToISO(formData.FromDate.toUpperCase()),
        to_date: convertToISO(formData.ToDate.toUpperCase()),
        days_incapacity: formData.DaysIncapacity.toUpperCase(),
        hospital: formData.Hospital.toUpperCase(),
        matricula: formData.Matricula.toUpperCase(),
        state: "ENTREGAR",
      };
      console.log("payload", payload);
      await AVC09Service.create(payload);

      Swal.fire(
        "Guardado",
        "El formulario AVC-09 se guardó correctamente",
        "success",
      );
      localStorage.removeItem("avc09_data");
      navigate("/");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error de comunicación con el backend",
        text: `${err}`,
      });
    }
  };

  const handleSave = async () => {
    if (!formData) {
      Swal.fire({
        icon: "error",
        title: "Error en los datos:",
        text: "No hay datos en el formulario para guardar",
      });
      return;
    }

    const from = new Date(convertToISO(formData.FromDate));
    const to = new Date(convertToISO(formData.ToDate));

    if (to < from) {
      Swal.fire({
        icon: "error",
        title: "Rango de fechas inválido",
        text: "La fecha HASTA no puede ser menor que la fecha DESDE.",
      });
      return;
    }
    if (!formData.InsuredNumber || !formData.FromDate || !formData.ToDate) {
      Swal.fire({
        icon: "error",
        title: "Campos Requeridos",
        text: "El Número de Asegurado, Fecha Desde y Fecha Hasta son obligatorios.",
      });
      return;
    }
    const validIssueDate = extractAndValidateIssueDate(formData.IsueDate);

    // Validar el formato de la fecha si es esencial (ej. "DD-MM-YYYY")
    // ✅ VALIDACIÓN DE FECHAS
    if (!validIssueDate) {
      Swal.fire({
        icon: "error",
        title: "Fecha de emisión inválida",
        html: `
      El campo <strong>LUGAR Y FECHA DE EMISIÓN</strong> debe contener una fecha válida.<br/>
      <br/>
      Ejemplo válido:<br/>
      <code>ORURO 2025-08-25</code>
    `,
        confirmButtonText: "Corregir",
      });
      return;
    }

    if (!isValidDate(formData.FromDate, "DMY")) {
      showDateError("FECHA DESDE", "DD-MM-YYYY");
      return;
    }

    if (!isValidDate(formData.ToDate, "DMY")) {
      showDateError("FECHA HASTA", "DD-MM-YYYY");
      return;
    }

    // if (
    //   !/^\d{2}-\d{2}-\d{4}$/.test(formData.FromDate) ||
    //   !/^\d{2}-\d{2}-\d{4}$/.test(formData.ToDate)
    // ) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Error de Formato",
    //     text: "Las fechas (DESDE/HASTA) deben estar en formato DD-MM-YYYY.",
    //   });
    //   // NOTA: Debes agregar una validación similar para IsueDate dependiendo de su formato esperado.
    //   return;
    // }

    const fullName =
      `${formData.LastName} ${formData.MaternalName} ${formData.FirstName}`
        .trim()
        .toUpperCase();

    const insuredNumber = formData.InsuredNumber.toUpperCase();

    try {
      let personnelFound: Personnel | null = null;
      const byInsured = await PersonnelService.search(insuredNumber);

      if (byInsured.data && byInsured.data.count > 0) {
        personnelFound = byInsured.data.results[0];
        console.log(
          "Personal Encontrado por Numero de Asegurado: ",
          personnelFound,
        );
      }

      if (!personnelFound) {
        const byName = await PersonnelService.search(fullName);

        console.log("nombre", byName);
        if (byName.data && byName.data.count > 0) {
          if (byName.data.count === 1) {
            personnelFound = byName.data.results[0];
            console.log(
              "Personal encontrado por nombre único:",
              personnelFound?.first_name,
            );

            await PersonnelService.update(personnelFound.id, {
              insured_number: insuredNumber,
            });

            console.log("Personal actualizado con nuevo insuredNumber");
          } else {
            Swal.fire({
              icon: "warning",
              title: "Personal duplicado",
              text: `Se encontraron ${byName.data.count} registros con el nombre '${fullName}'. Por favor, use el Número de Asegurado o corrija los datos.`,
              confirmButtonText: "Corregir",
            });
            return;
          }
          // personnelFound = byName.data[0];
          // console.log("Personal encontrado por nombre:", personnelFound);
          //
          // await PersonnelService.update(personnelFound.id, {
          //   insured_number: insuredNumber,
          // });
          //
          // console.log("Personal actualizado con nuevo insuredNumber");
        }
      }

      if (!personnelFound) {
        const result = await Swal.fire({
          title: "¿No existe este personal?",
          text: "Revise si cometió un error en la escritura. ¿Desea corregir o crear un nuevo personal?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Crear nuevo",
          cancelButtonText: "Corregir",
        });

        if (!result.isConfirmed) {
          return;
        }
        setIsModalOpen(true);
        return;
      }
      console.log("id", personnelFound.id);
      await createAffiliation(personnelFound.id);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error de comunicación con el backend",
        text: `${err}`,
      });
    }
  };
  if (!formData) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>No hay datos para mostrar</h2>
        <button onClick={() => navigate("/")}>Volver</button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex space-x-4">
        <h2 className="text-red-600 text-xl dark:text-red-400">
          Por favor revise todos los datos del siguiente formulario, para
          validar!
        </h2>
        <Button
          type="submit"
          className="bg-lime-700 hover:bg-lime-800"
          size="sm"
          onClick={handleSave}
        >
          GUARDAR
        </Button>
        <Button
          type="submit"
          className="bg-red-500 hover:bg-red-600"
          size="sm"
          onClick={onCancel}
        >
          CANCELAR
        </Button>
      </div>
      <div className="form-wrapper">
        <header className="form-header dark:text-white">
          <div className="header-left">
            <h2>CAJA NACIONAL DE SALUD</h2>
            <h3>DEPARTAMENTO DE AFILIACIONES</h3>
            <h1>CERTIFICADO DE INCAPACIDAD TEMPORAL</h1>
          </div>
          <div className="header-right">
            <div className="form-id">Form. AVC-09</div>
          </div>
        </header>
        <div className="form-grid dark:text-white">
          <div className="grid-item item-1">
            {renderInput("(1) AP. PATERNO", "LastName")}
          </div>
          <div className="grid-item item-2">
            {renderInput("(2) AP. MATERNO", "MaternalName")}
          </div>
          <div className="grid-item item-3">
            {renderInput("(3) NOMBRES", "FirstName")}
          </div>
          <div className="grid-item item-4">
            {renderInput("(4) Nº ASEGURADO", "InsuredNumber")}
          </div>

          <div className="grid-item item-5">
            {renderInput(
              "(5) NOMBRE O RAZÓN SOCIAL DEL EMPLEADOR",
              "CompanyName",
            )}
          </div>
          <div className="grid-item item-6">
            {renderInput("(6) Nº EMPLEADOR", "EmployerNumber")}
          </div>

          <div className="grid-item item-7">
            {renderInput("(7) TIPO DE RIESGO", "TypeRisk")}
          </div>
          <div className="grid-item item-8">
            {renderInput("LUGAR Y FECHA DE EMISIÓN", "IsueDate")}
          </div>
          <div className="grid-item item-9">{"INCAPACIDAD"}</div>
          <div className="grid-item item-10">
            {renderInput("DESDE:", "FromDate")}
            {renderInput("HASTA:", "ToDate")}
          </div>
          <div className="grid-item item-11">
            {renderInput("DIAS DE INCAPACIDAD:", "DaysIncapacity")}
          </div>

          <div className="grid-item item-12">
            <span className="item-label text-lg font-bold mt-2.5">
              (8) VIGENCIA DE DERECHOS
            </span>
            <div className="stamp-area">
              <strong className="text-lg">
                [Sello CAJA NACIONAL DE SALUD]
              </strong>
            </div>
          </div>

          <div className="grid-item item-signature-doc">
            {renderSignature("[Firma Médico]", "FIRMA MEDICO")}
          </div>
          <div className="grid-item item-stamp-doc">
            {renderSignature("[Sello Médico]", "SELLO MEDICO")}
          </div>
          <div className="grid-item hospital">
            {renderInput("UNINDAD MED.:", "Hospital")}
          </div>
          <div className="grid-item matricula">
            {renderInput("MATRICULA:", "Matricula")}
          </div>
          <div className="grid-item name-signature">
            <label>Nombre y Firma V.D. CNS</label>
          </div>

          <div className="grid-item item-lugar">
            {renderSignature(
              "..................................................................",
              "(9) Lugar y Fecha",
            )}
          </div>

          <div className="grid-item item-insured">
            {renderSignature(
              "..................................................................",
              "(10) Firma del asegurado",
            )}
          </div>

          <div className="grid-item item-company">
            {renderSignature(
              "..................................................................",
              "(11) Sello y Firma de la Empresa",
            )}
          </div>
        </div>
      </div>
      <PersonnelModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        personnelToEdit={personnelToEdit}
        onSave={handleSavePersonnel}
        initialData={{
          first_name: formData?.FirstName ?? "",
          last_name: formData?.LastName ?? "",
          maternal_name: formData?.MaternalName ?? "",
          insured_number: formData?.InsuredNumber ?? "",
        }}
      />
    </div>
  );
};

export default FormAVC09;
