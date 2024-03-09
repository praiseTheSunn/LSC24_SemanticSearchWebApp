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

    const getSize = () => selectedImages.length;

    const imagePathE = 'E:\\LSCDATA\\keyframes'; // Absolute path to images on Disk E
    const getPath = (fileName) => {
        return `file://${imagePathE}/201902/01/${fileName}`;
    };

    return (
        <SelectedImagesContext.Provider value={{ selectedImages, addSelectedImage, removeSelectedImage , getSize, getPath}}>
        {children}
        </SelectedImagesContext.Provider>
    );
};
