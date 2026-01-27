import { Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { ScrollToTop, Loader } from "../common";
import { AppLayout } from "../../layout";
import { FormAVC09 } from "../afiliations";

// Lazy loading pages
const Alerts = lazy(() => import("../../pages/UiElements/Alerts"));
const Avatars = lazy(() => import("../../pages/UiElements/Avatars"));
const AVC09Desktop = lazy(() => import("../../pages/Afiliations/AVC09Desktop"));
const AVC09MobileUpload = lazy(() => import("../../pages/Afiliations/AVC09MobileUpload"));
const AVC09Tables = lazy(() => import("../../pages/Tables/AVC09Tables"));
const Badges = lazy(() => import("../../pages/UiElements/Badges"));
const BarChart = lazy(() => import("../../pages/Charts/BarChart"));
const Blank = lazy(() => import("../../pages/Blank"));
const Buttons = lazy(() => import("../../pages/UiElements/Buttons"));
const Calendar = lazy(() => import("../../pages/Calendar"));
const FilePersonnelTables = lazy(() => import("../../pages/Tables/FilePersonnelTables"));
const FormElements = lazy(() => import("../../pages/Forms/FormElements"));
const Home = lazy(() => import("../../pages/Dashboard/Home"));
const HospitalTables = lazy(() => import("../../pages/Tables/HospitalTables"));
const Images = lazy(() => import("../../pages/UiElements/Images"));
const LineChart = lazy(() => import("../../pages/Charts/LineChart"));
const MobileAuthConsumer = lazy(() => import("../../pages/AuthPages/MobileAuthConsumer"));
const NatalDataTablePage = lazy(() => import("../../pages/Tables/NatalDataTablePage"));
const NotFound = lazy(() => import("../../pages/OtherPage/NotFound"));
const PersonnelTables = lazy(() => import("../../pages/Tables/PersonnelTables"));
const PrenatalRecordsPage = lazy(() => import("../../pages/Tables/PrenatalRecordsPage"));
const SickLeaveTables = lazy(() => import("../../pages/Tables/SickLeaveTables"));
const SignIn = lazy(() => import("../../pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("../../pages/AuthPages/SignUp"));
const UnitsTables = lazy(() => import("../../pages/Tables/UnitsTables"));
const UserProfiles = lazy(() => import("../../pages/UserProfiles"));
const UsersTables = lazy(() => import("../../pages/Tables/UsersTables"));
const Videos = lazy(() => import("../../pages/UiElements/Videos"));

export function AppRouter() {
  return (
    <Suspense fallback={<Loader />}>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          {/* Rutas Comunes */}
          <Route index path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfiles />
              </ProtectedRoute>
            }
          />

          {/* Rutas restringidas por Rol */}
          <Route
            path="/sick-leave"
            element={
              <ProtectedRoute>
                <SickLeaveTables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload09"
            element={
              <ProtectedRoute>
                <AVC09Desktop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload/mobile/"
            element={
              <ProtectedRoute>
                <AVC09MobileUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/mobile-login/:tokenKey"
            element={
              <ProtectedRoute>
                <MobileAuthConsumer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/avc09"
            element={
              <ProtectedRoute>
                <AVC09Tables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/formavc09"
            element={
              <ProtectedRoute>
                <FormAVC09 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />

          {/* Rutas solo Admin */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersTables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospitals"
            element={
              <ProtectedRoute>
                <HospitalTables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personnel"
            element={
              <ProtectedRoute>
                <PersonnelTables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prenatal-records"
            element={
              <ProtectedRoute>
                <PrenatalRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/natal-data"
            element={
              <ProtectedRoute>
                <NatalDataTablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/units"
            element={
              <ProtectedRoute>
                <UnitsTables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/filepersonnel"
            element={
              <ProtectedRoute>
                <FilePersonnelTables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blank"
            element={
              <ProtectedRoute>
                <Blank />
              </ProtectedRoute>
            }
          />
          {/* Charts */}
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />
          <Route path="/mobile-link/:token" element={<AVC09MobileUpload />} />
        </Route>

        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

// import { Routes, Route } from "react-router-dom";
// import {
//   Alerts,
//   Avatars,
//   AVC09Desktop,
//   AVC09MobileUpload,
//   AVC09Tables,
//   Badges,
//   BarChart,
//   Blank,
//   Buttons,
//   Calendar,
//   FilePersonnelTables,
//   FormElements,
//   Home,
//   HospitalTables,
//   Images,
//   LineChart,
//   MobileAuthConsumer,
//   NotFound,
//   PersonnelTables,
//   SickLeaveTables,
//   SignIn,
//   SignUp,
//   UnitsTables,
//   UserProfiles,
//   UsersTables,
//   Videos,
// } from "../../pages";
// import { ScrollToTop } from "../common";
// import { AppLayout } from "../../layout";
// import PrivateRoute from "./PrivateRoute";
// import { FormAVC09 } from "../afiliations";
// export function AppRouter() {
//   return (
//     <>
//       <ScrollToTop />
//       <Routes>
//         {/* Dashboard Layout */}
//         <Route
//           element={
//             <PrivateRoute>
//               <AppLayout />
//             </PrivateRoute>
//           }
//         >
//           <Route index path="/" element={<Home />} />
//
//           {/* Others Page */}
//           <Route path="/profile" element={<UserProfiles />} />
//           <Route path="/calendar" element={<Calendar />} />
//           <Route path="/blank" element={<Blank />} />
//
//           {/* Forms */}
//           <Route path="/form-elements" element={<FormElements />} />
//           <Route path="/formavc09" element={<FormAVC09 />} />
//
//           {/* Tables */}
//           <Route path="/users" element={<UsersTables />} />
//           <Route path="/sick-leave" element={<SickLeaveTables />} />
//           <Route path="/avc09" element={<AVC09Tables />} />
//           <Route path="/hospitals" element={<HospitalTables />} />
//           <Route path="/personnel" element={<PersonnelTables />} />
//           <Route path="/units" element={<UnitsTables />} />
//           <Route path="/filepersonnel" element={<FilePersonnelTables />} />
//
//           {/* Ui Elements */}
//           <Route path="/alerts" element={<Alerts />} />
//           <Route path="/avatars" element={<Avatars />} />
//           <Route path="/badge" element={<Badges />} />
//           <Route path="/buttons" element={<Buttons />} />
//           <Route path="/images" element={<Images />} />
//           <Route path="/videos" element={<Videos />} />
//
//           {/* Charts */}
//           <Route path="/line-chart" element={<LineChart />} />
//           <Route path="/bar-chart" element={<BarChart />} />
//
//           {/* img correct */}
//           <Route path="/upload09" element={<AVC09Desktop />} />
//
//           <Route path="/upload/mobile/" element={<AVC09MobileUpload />} />
//           <Route
//             path="/auth/mobile-login/:tokenKey"
//             element={<MobileAuthConsumer />}
//           />
//         </Route>
//
//         <Route path="/mobile-link/:token" element={<AVC09MobileUpload />} />
//         <Route path="/avc09/upload-mobile/" element={<AVC09MobileUpload />} />
//         {/* Auth Layout */}
//         <Route path="/signin" element={<SignIn />} />
//         <Route path="/signup" element={<SignUp />} />
//
//         {/* Fallback Route */}
//         <Route path="*" element={<NotFound />} />
//           <Route path="/blank" element={<Blank />} />
//       </Routes>
//     </>
//   );
// }
//
export default AppRouter;
