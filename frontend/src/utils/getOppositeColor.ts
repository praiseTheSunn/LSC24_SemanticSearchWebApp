export const getOppositeColor = (HexaStr: string): string => {
    // Remove the hash symbol if present
    const hex = HexaStr.replace('#', '')
  
    // Convert hex string to an integer, invert the bits, and mask with 0xFFFFFF
    const invertedColor = (Number.parseInt(hex, 16) ^ 0xffffff)
      .toString(16)
      .padStart(6, '0')
  
    // Return the inverted color as a hex string with a hash symbol
    return `#${invertedColor}`
  }