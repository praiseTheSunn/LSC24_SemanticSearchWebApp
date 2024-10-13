import { Box } from '@mui/material'
import {
  type Dispatch,
  type FC,
  type MouseEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAppSelector } from '../AppState'
import { PoseConnection } from '../data/PoseConnection'

interface PoseCanvasProps {
  joints: Record<string, [number, number]> | null
  setJoints: Dispatch<SetStateAction<Record<string, [number, number]> | null>>
}

let draggingSelection = false
let draggingJoint: string | null = null

const PoseCanvas = ({ joints, setJoints }: PoseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [selectionBox, setSelectionBox] = useState<
    [number, number, number, number] | null
  >(null)
  const [selectedJoints, setSelectedJoints] = useState<string[]>([])
  const [dragStart, setDragStart] = useState<[number, number] | null>(null)

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const columns = 20
      const rows = 20
      const cellWidth = width / columns
      const cellHeight = height / rows

      ctx.strokeStyle = 'lightgray'
      ctx.lineWidth = 1

      for (let i = 0; i <= columns; i++) {
        const x = i * cellWidth
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (let i = 0; i <= rows; i++) {
        const y = i * cellHeight
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    },
    [],
  )

  const drawPose = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvasWidth = ctx.canvas.width
      const canvasHeight = ctx.canvas.height

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      drawGrid(ctx, canvasWidth, canvasHeight)

      if (!joints) return

      const connections: string[][] = PoseConnection
      for (const [start, end] of connections) {
        ctx.beginPath()
        ctx.moveTo(...joints[start])
        ctx.lineTo(...joints[end])
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 5
        ctx.stroke()
      }

      // Draw joints
      for (const [joint, [x, y]] of Object.entries(joints)) {
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = selectedJoints.includes(joint) ? 'red' : 'black' // Highlight selected joints in red
        ctx.fill()
      }

      // Draw selection box if dragging
      if (selectionBox) {
        const [x1, y1, x2, y2] = selectionBox
        ctx.beginPath()
        ctx.rect(x1, y1, x2 - x1, y2 - y1)
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    },
    [joints, selectedJoints, selectionBox, drawGrid],
  )

  const getJointAtPosition = useCallback(
    (x: number, y: number) => {
      if (joints === null) return null
      return (
        Object.entries(joints).find(([, [jointX, jointY]]) => {
          return Math.hypot(jointX - x, jointY - y) < 10
        })?.[0] || null
      )
    },
    [joints],
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const joint = getJointAtPosition(mouseX, mouseY)
        if (joint) {
          draggingJoint = joint
        } else {
          setDragStart([mouseX, mouseY])
          draggingSelection = true
          setSelectedJoints([])
        }
      }
    },
    [getJointAtPosition],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      if (draggingJoint) {
        setJoints((prevJoints) => ({
          ...prevJoints,
          [draggingJoint as string]: [mouseX, mouseY],
        }))
      } else if (draggingSelection && dragStart) {
        const [startX, startY] = dragStart
        setSelectionBox([startX, startY, mouseX, mouseY])

        const smallerX = Math.min(startX, mouseX)
        const largerX = Math.max(startX, mouseX)
        const smallerY = Math.min(startY, mouseY)
        const largerY = Math.max(startY, mouseY)

        const newSelectedJoints = joints
          ? Object.entries(joints)
              .filter(
                ([, [x, y]]) =>
                  x > smallerX && x < largerX && y > smallerY && y < largerY,
              )
              .map(([joint]) => joint)
          : []
        setSelectedJoints(newSelectedJoints)
      }
    },
    [dragStart, joints],
  )

  const handleMouseUp = useCallback(() => {
    draggingJoint = null
    if (draggingSelection) {
      draggingSelection = false
      setSelectionBox(null)
    }
  }, [])

  const handleMouseMoveSelection = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (canvas && draggingJoint && selectedJoints.length > 0) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        if (!joints) return
        const deltaX = mouseX - joints[draggingJoint][0]
        const deltaY = mouseY - joints[draggingJoint][1]

        setJoints((prevJoints) => {
          const newJoints = { ...prevJoints }
          for (const joint of selectedJoints) {
            newJoints[joint] = [
              newJoints[joint][0] + deltaX,
              newJoints[joint][1] + deltaY,
            ]
          }
          return newJoints
        })
      }
    },
    [selectedJoints, joints],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        drawPose(ctx)
      }
    }
  }, [drawPose])

  const systemConfig = useAppSelector((state) => state.app.config)

  return (
    <Box height="100%">
      <canvas
        ref={canvasRef}
        height={`${systemConfig.WhiteboardCanvasHeight}px`}
        width={`${systemConfig.WhiteboardCanvasWidth}px`}
        style={{ border: '1px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseMoveCapture={handleMouseMoveSelection}
        onMouseUp={handleMouseUp}
      />
    </Box>
  )
}

export default PoseCanvas
