import React from "react";
import { Routes, Route } from "react-router-dom";
import StaffDashboard from "../StaffDashboard";
import StaffPlaceOrder from "./StaffPlaceOrder";
import StaffMyOrders from "./StaffMyOrders";
import StaffDistributorProfiles from "./StaffDistributorProfiles";

export default function StaffRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<StaffDashboard />} />
      <Route path="orders" element={<StaffPlaceOrder />} />
      <Route path="my-orders" element={<StaffMyOrders />} />
      <Route path="profile" element={<StaffDistributorProfiles />} />
    </Routes>
  );
}
