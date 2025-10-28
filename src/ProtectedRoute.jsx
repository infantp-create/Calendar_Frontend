import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid } from "./utils/helper";

const ProtectedRoute = ({ children }) => {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
