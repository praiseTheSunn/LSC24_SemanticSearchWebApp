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

export const Config = {
  gridRowGap: '2px',

  ImageGridColumnCount: 7,
  ImageGridCellHeight: 120, // Default cell height

  ViewMorePopupColumnCount: 8,
  ViewMorePopupCellHeight: 130, // Default cell height

  SinglePopupCellHeight: 95,
  SinglePopupColumnCount: 5,

  NeighborPopupCellHeight: 90,
  NeighborPopupColumnCount: 9,
}
