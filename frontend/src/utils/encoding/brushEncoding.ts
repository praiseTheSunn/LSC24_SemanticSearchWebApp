import type { GridDict } from '../../components/Popup/ObjectPositionPopup'
import { hex_to_number } from '../../data/ColorToCode'

export const brushEncoding = (datagrid: GridDict[][]) => {
  const brush_color_global_encoding: { [key: string]: number } = {}
  let brush_obj_local_encoding = ''
  let brush_color_local_encoding = ''
  for (const row of datagrid) {
    for (const cell of row) {
      const rowIdx = datagrid.indexOf(row)
      const colIdx = row.indexOf(cell)
      if (cell.color && cell.color !== '') {
        const colorCode =
          hex_to_number[cell.color.split('#')[1] as keyof typeof hex_to_number]
        brush_color_global_encoding[colorCode] = !brush_color_global_encoding[
          colorCode
        ]
          ? 1
          : brush_color_global_encoding[colorCode] + 1
        const encodeColor = `${String.fromCharCode(65 + rowIdx)}${String.fromCharCode(97 + colIdx)}${colorCode}`
        brush_color_local_encoding = brush_color_local_encoding.concat(
          ' ',
          encodeColor,
        )
      }
      if (cell.objectName && cell.objectName !== 'none') {
        const objName = cell.objectName.replace(' ', '_')
        const encodeObject = `${String.fromCharCode(65 + rowIdx)}${String.fromCharCode(97 + colIdx)}${objName}`
        brush_obj_local_encoding = brush_obj_local_encoding.concat(
          ' ',
          encodeObject,
        )
      }
    }
  }

  return {
    brush_color_global_encoding,
    brush_obj_local_encoding,
    brush_color_local_encoding,
  }
}
