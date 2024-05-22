import React, { createContext, useContext, useState } from 'react';

const NeighborPopupContext = createContext();

export const useNeighborPopup = () => {
  return useContext(NeighborPopupContext);
};

export const NeighborPopupProvider = ({ children }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  const openPopup = (src) => {
    setPopupImage(src);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setPopupImage(null);
  };

  return (
    <NeighborPopupContext.Provider value={{ isPopupOpen, popupImage, openPopup, closePopup }}>
      {children}
    </NeighborPopupContext.Provider>
  );
};