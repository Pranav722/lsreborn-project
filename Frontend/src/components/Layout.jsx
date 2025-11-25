import React from 'react';

const Layout = ({ children }) => (
  <div className="text-white min-h-screen font-lexend relative">
    {/* Background image/color is handled by CSS or specific page layouts */}
    <div className="bg-gray-950 min-h-screen">
        {children}
    </div>
  </div>
);

export default Layout;