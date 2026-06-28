import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { PrivateLayout } from "./layout/PrivateLayout";
import "./App.css";
import { CarCreatePage } from "./pages/cars/CarCreatePage";
import { CarDetailPage } from "./pages/cars/CarDetailPage";
import { CarEditPage } from "./pages/cars/CarEditPage";
import { CarsListPage } from "./pages/cars/CarsListPage";
import { CargoCreatePage } from "./pages/cargo/CargoCreatePage";
import { CargoDetailPage } from "./pages/cargo/CargoDetailPage";
import { CargoEditPage } from "./pages/cargo/CargoEditPage";
import { CargoListPage } from "./pages/cargo/CargoListPage";
import { ContractDetailPage } from "./pages/contracts/ContractDetailPage";
import { ContractsListPage } from "./pages/contracts/ContractsListPage";
import { LoginPage } from "./pages/LoginPage";
import { MockupsPage } from "./pages/MockupsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { UserCompletedContractsPage } from "./pages/UserCompletedContractsPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mockups" element={<MockupsPage />} />
          <Route path="/" element={<PrivateLayout />}>
            <Route index element={<Navigate to="/cars" replace />} />
            <Route path="cars/new" element={<CarCreatePage />} />
            <Route path="cars/:id/edit" element={<CarEditPage />} />
            <Route path="cars/:id" element={<CarDetailPage />} />
            <Route path="cars" element={<CarsListPage />} />
            <Route path="cargo/new" element={<CargoCreatePage />} />
            <Route path="cargo/:id/edit" element={<CargoEditPage />} />
            <Route path="cargo/:id" element={<CargoDetailPage />} />
            <Route path="cargo" element={<CargoListPage />} />
            <Route path="contracts/:id" element={<ContractDetailPage />} />
            <Route path="contracts" element={<ContractsListPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="users/:uuid/completed" element={<UserCompletedContractsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
