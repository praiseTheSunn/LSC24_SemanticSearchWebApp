import React, { createContext, useContext, useState } from 'react';

const SinglePopupContext = createContext();

export const useSinglePopup = () => {
  return useContext(SinglePopupContext);
};

export const SinglePopupProvider = ({ children }) => {
  const [isSinglePopupOpen, setIsSinglePopupOpen] = useState(false);
  const [singlePopupImage, setSinglePopupImage] = useState(null);

  const openSinglePopup = (src) => {
    setSinglePopupImage(src);
    setIsSinglePopupOpen(true);
  };

  const closeSinglePopup = () => {
    setIsSinglePopupOpen(false);
    setSinglePopupImage(null);
  };

  return (
    <SinglePopupContext.Provider value={{ isSinglePopupOpen, singlePopupImage, openSinglePopup, closeSinglePopup }}>
      {children}
    </SinglePopupContext.Provider>
  );
};