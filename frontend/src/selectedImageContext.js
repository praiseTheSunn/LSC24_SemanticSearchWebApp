// SelectedImagesContext.js
import React, { createContext, useContext, useState } from 'react';

const SelectedImagesContext = createContext(0);

export const useSelectedImages = () => useContext(SelectedImagesContext);

export const SelectedImagesProvider = ({ children }) => {
    const [selectedImages, setSelectedImages] = useState([]);

    const addSelectedImage = (imageUrl) => {
        setSelectedImages((prevImages) => [...prevImages, imageUrl]);
    };

    const removeSelectedImage = (imageUrl) => {
        setSelectedImages((prevImages) => prevImages.filter((img) => img !== imageUrl));
    };

    const getSize = () => {
        return selectedImages.length;
    }

    const removeAllSelected = () => {
        setSelectedImages([]);
    }

    return (
        <SelectedImagesContext.Provider value={{ selectedImages, addSelectedImage, removeSelectedImage , getSize, removeAllSelected}}>
        {children}
        </SelectedImagesContext.Provider>
    );
};
