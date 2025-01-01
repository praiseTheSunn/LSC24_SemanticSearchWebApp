import type { ConfigType } from '../types/app'

export { default as SearchBox } from './searchBox'

export { default as MessagePopup } from './Popup/messagePopup'

export { default as KhangScrollBar } from './KhangScrollBar'

export { default as ActivityBar } from './activityBar'

export { default as ImageGroup } from './Image/imageGroup'

export { default as ImageSingle } from './Image/imageSingle'

// export { default as Scrollbar } from './scrollbar';
export { default as TimelineTab } from '../containers/timeline/timelineTab'

export { default as Whiteboard } from './WhiteBoard'
export { default as DragIcon } from './DragIcon'
export { default as ObjectPositionPopup } from './Popup/ObjectPositionPopup'

export { default as AnImage } from './AnImage'
export { default as ViewMorePopup } from './Popup/viewMorePopup'

export { default as ObjectDetail } from './ObjectDetail'

// export const Config = {
//   gridRowGap: '2px',

//   ImageGridColumnCount: 7,
//   ImageGridCellHeight: 120, // Default cell height

//   ViewMorePopupColumnCount: 8,
//   ViewMorePopupCellHeight: 130, // Default cell height

//   SinglePopupCellHeight: 95,
//   SinglePopupColumnCount: 5,

//   NeighborPopupCellHeight: 90,
//   NeighborPopupColumnCount: 9,

//   WhiteboardGridRowCount: 7,
//   WhiteboardGridColumnCount: 7,
// }

// Helper functions with type safety for localStorage
export const saveConfigToLocalStorage = (config: ConfigType): void => {
  localStorage.setItem('userConfig', JSON.stringify(config))
}

export const loadConfigFromLocalStorage = (): ConfigType | null => {
  const savedConfig = localStorage.getItem('userConfig')
  if (savedConfig) {
    return JSON.parse(savedConfig) as ConfigType
  }
  return null
}

// Default Config values
export const defaultConfig: ConfigType = {
  gridRowGap: '2px',

  NeighborTabCellMinWidth: 130,
  NeighborTabRowHeight: 150,

  ImageGridColumnCount: 7,
  ImageGridCellHeight: 120,

  ViewMorePopupColumnCount: 8,
  ViewMorePopupCellHeight: 130,

  SinglePopupCellHeight: 95,
  SinglePopupColumnCount: 5,

  NeighborPopupCellHeight: 90,
  NeighborPopupColumnCount: 9,
  NeighborPopupSpan: 30,

  WhiteboardGridRowCount: 20,
  WhiteboardGridColumnCount: 20,

  WhiteboardCanvasWidth: 402,
  WhiteboardCanvasHeight: 270,

  LikeNumber: 30,
  DislikeNumber: 100,
}

// Load user config if it exists in localStorage, otherwise use default
// export const Config: ConfigType = loadConfigFromLocalStorage() || defaultConfig;
