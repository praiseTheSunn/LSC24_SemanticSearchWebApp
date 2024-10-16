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
      if (cell.color && cell.color !== 'none') {
        const colorCode =
          hex_to_number[cell.color as keyof typeof hex_to_number]
        brush_color_global_encoding[colorCode] = !brush_color_global_encoding[
          colorCode
        ]
          ? 0
          : brush_color_global_encoding[colorCode] + 1
        const encodeColor = `${rowIdx}${String.fromCharCode(97 + colIdx)}${colorCode}`
        brush_color_local_encoding = brush_color_local_encoding.concat(
          ' ',
          encodeColor,
        )
      }
      if (cell.objectName && cell.objectName !== 'none') {
        const encodeObject = `${rowIdx}${String.fromCharCode(97 + colIdx)}${cell.objectName}`
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
