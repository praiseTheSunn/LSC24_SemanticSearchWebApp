import type { DrawnItem } from '../../components/Popup/ObjectPositionPopup'

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
    if (!obj_global_encoding[iconName]) {
      obj_global_encoding[iconName] = 0
    }
    if (
      iconColor &&
      iconColor !== 'none' &&
      !color_global_encoding[iconColor]
    ) {
      color_global_encoding[iconColor] = 0
    }
    if (iconColor && iconColor !== 'none') color_global_encoding[iconColor] += 1
    obj_global_encoding[iconName] += 1
    obj_local_encoding = obj_local_encoding.concat(' ', encodeObjects)
    color_local_encoding = color_local_encoding.concat(' ', encodeColors)
  }

  return {
    obj_global_encoding,
    color_global_encoding,
    obj_local_encoding,
    color_local_encoding,
  }
}
