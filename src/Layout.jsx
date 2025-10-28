import React from "react";
import { BrowserRouter, Outlet } from "react-router-dom";
import TopBar from "./Components/TopBar";

const Layout = () => {
  return (
    <div className="app-layout">
         <TopBar />
      <div className="content">
        <Outlet /> {/* Protected pages will render here */}
      </div>
    </div>
  );
};

export default Layout;