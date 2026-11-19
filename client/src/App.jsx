
// import {
//   Navigate,
//   Route,
//   Routes,
// } from "react-router-dom";

// import { useAuth } from "./context/AuthContext";

// import Navbar from "./components/Navbar";
// import ProtectedRoute from "./components/ProtectedRoute";

// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";

// // Wrap authenticated pages with the navbar
// function AppLayout() {
//   return (
//     <>
//       <Navbar />
//       <Dashboard />
//     </>
//   );
// }

// function HomeRedirect() {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="loading-screen">
//         Loading Sweety...
//       </div>
//     );
//   }

//   return (
//     <Navigate
//       to={isAuthenticated ? "/dashboard" : "/login"}
//       replace
//     />
//   );
// }

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<HomeRedirect />} />

//       <Route path="/login" element={<Login />} />

//       <Route path="/register" element={<Register />} />

//       <Route element={<ProtectedRoute />}>
//         <Route
//           path="/dashboard"
//           element={<AppLayout />}
//         />
//       </Route>

//       <Route path="*" element={<HomeRedirect />} />

//       <Route element={<ProtectedRoute />}>
//   <Route
//     path="/dashboard"
//     element={<AppLayout />}
//   />
// </Route>
//     </Routes>
//   );
// }


import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";

// Shared layout for authenticated pages
function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// Redirect visitors based on login state
function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        Loading Sweety...
      </div>
    );
  }

  return (
    <Navigate
      to={isAuthenticated ? "/dashboard" : "/login"}
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      {/* Public authentication pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />
        </Route>
      </Route>

      {/* Unknown route */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
