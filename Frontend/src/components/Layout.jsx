import React from 'react';

const Layout = ({ children }) => (
  <div className="text-white min-h-screen font-lexend relative">
    <div className="bg-image-container"></div>
    <div className="bg-overlay"></div>
    {children}
  </div>
);

export default Layout;