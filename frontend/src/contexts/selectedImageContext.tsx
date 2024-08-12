// SelectedImagesContext.js
import React, { createContext, useContext, useState } from 'react'

const SelectedImagesContext = createContext(0)

export const useSelectedImages = () => useContext(SelectedImagesContext)

export const SelectedImagesProvider = ({ children } : { children: any}) => {
  const [selectedImages, setSelectedImages] = useState<any[]>([])

  const addSelectedImage = (imageUrl: string, image: any) => {
    console.log('adding', imageUrl)
    setSelectedImages((prevImages) => [
      ...prevImages,
      { url: imageUrl, image: image },
    ])
  }

  const removeSelectedImage = (imageUrl: string) => {
    setSelectedImages((prevImages) =>
      prevImages.filter((img) => img.url !== imageUrl),
    )
  }

  const getSize = () => {
    return selectedImages.length
  }

  const removeAllSelected = () => {
    setSelectedImages([])
  }

  const [displayedImages, setDisplayedImages] = useState(true)

  return (
    <SelectedImagesContext.Provider
      value={{
        displayedImages,
        setDisplayedImages,
        selectedImages,
        addSelectedImage,
        removeSelectedImage,
        getSize,
        removeAllSelected,
      }}
    >
      {children}
    </SelectedImagesContext.Provider>
  )
}
