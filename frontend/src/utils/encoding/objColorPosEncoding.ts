import type { DrawnItem } from '../../components/Popup/ObjectPositionPopup'
import { hex_to_number } from '../../data/ColorToCode'

interface ObjColorPosEncoding {
  selectedObjects: DrawnItem[]
}

export const objColorPosEncoding = ({
  selectedObjects,
}: ObjColorPosEncoding) => {
  const obj_global_encoding: { [key: string]: number } = {}
  const color_global_encoding: { [key: string]: number } = {}
  let obj_local_encoding = ''
  let color_local_encoding = ''

  for (const item of selectedObjects) {
    const { encodeObjects, encodeColors, icon } = item
    const iconName = icon.name.replace(' ', '_')
    const iconColor = icon.color ? icon.color.replace('#', '') : 'none'

    if (iconColor && iconColor !== 'none') {
      const colorCode = hex_to_number[iconColor as keyof typeof hex_to_number]
      color_global_encoding[colorCode] = !color_global_encoding[colorCode]
        ? 1
        : color_global_encoding[colorCode] + 1
      color_local_encoding = color_local_encoding.concat(' ', encodeColors)
    }
    if (iconName && iconName !== 'none') {
      obj_global_encoding[iconName] = !obj_global_encoding[iconName]
        ? 1
        : obj_global_encoding[iconName] + 1
      obj_local_encoding = obj_local_encoding.concat(' ', encodeObjects)
    }
  }

  return {
    obj_global_encoding,
    color_global_encoding,
    obj_local_encoding,
    color_local_encoding,
  }
}
