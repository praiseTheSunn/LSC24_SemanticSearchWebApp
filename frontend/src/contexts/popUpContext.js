import React, {createContext, useContext, useState} from 'react';

const PopUpContext = createContext(0);

export const usePopUp = () => useContext(PopUpContext);

export const PopUpProvider = ({children}) => {
    const [similarPopUp, setSimilarPopUp] = useState(false);
    const [neighborPopUp, setNeighborPopUp] = useState(false);
    const [loadingPopUp, setLoadingPopUp] = useState(false);

    return(
        <PopUpContext.Provider value={{similarPopUp, setSimilarPopUp, neighborPopUp, setNeighborPopUp, loadingPopUp, setLoadingPopUp}}>
            {children}
        </PopUpContext.Provider>
    );
}

