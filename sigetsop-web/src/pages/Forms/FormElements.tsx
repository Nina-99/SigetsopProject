import {
  CheckboxComponents,
  DefaultInputs,
  DropzoneComponent,
  FileInputExample,
  InputGroup,
  InputStates,
  PageBreadCrumb,
  PageMeta,
  RadioButtons,
  SelectInputs,
  TextAreaInput,
  ToggleSwitch,
} from "../../components";

export default function FormElements() {
  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | Marco Nina Nuñez Author - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for Marco Nina Nuñez Author - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadCrumb pageTitle="Form Elements" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DefaultInputs />
          <SelectInputs />
          <TextAreaInput />
          <InputStates />
        </div>
        <div className="space-y-6">
          <InputGroup />
          <FileInputExample />
          <CheckboxComponents />
          <RadioButtons />
          <ToggleSwitch />
          <DropzoneComponent />
        </div>
      </div>
    </div>
  );
}
