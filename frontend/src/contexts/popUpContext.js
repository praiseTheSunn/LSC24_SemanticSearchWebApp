import React, {createContext, useContext, useState} from 'react';

const PopUpContext = createContext(0);

export const usePopUp = () => useContext(PopUpContext);

export const PopUpProvider = ({children}) => {
    const [similarPopUp, setSimilarPopUp] = useState(null);
    const [neighborPopUp, setNeighborPopUp] = useState(null);
    const [loadingPopUp, setLoadingPopUp] = useState(false);
    const [currentImage, setCurrentImage] = useState({});

    return(
        <PopUpContext.Provider value={{similarPopUp, setSimilarPopUp, neighborPopUp, setNeighborPopUp, loadingPopUp, setLoadingPopUp
            ,currentImage, setCurrentImage
        }}>
            {children}
        </PopUpContext.Provider>
    );
}
