import { Box } from '@mui/material'
import type React from 'react'
import { type FC, type MouseEvent, useEffect, useRef, useState } from 'react'

const PoseCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [joints, setJoints] = useState<Record<string, [number, number]>>({
    nose: [200, 20],
    right_shoulder: [250, 80],
    right_elbow: [270, 100],
    right_wrist: [290, 120],
    left_shoulder: [150, 80],
    left_elbow: [130, 100],
    left_wrist: [110, 120],
    right_hip: [250, 150],
    right_knee: [250, 200],
    right_ankle: [250, 250],
    left_hip: [150, 150],
    left_knee: [150, 200],
    left_ankle: [150, 250],
    right_eye: [210, 10],
    left_eye: [190, 10],
    right_ear: [230, 20],
    left_ear: [170, 20],
  })
  const [draggingJoint, setDraggingJoint] = useState<string | null>(null)
  const [draggingSelection, setDraggingSelection] = useState<boolean>(false)
  const [selectionBox, setSelectionBox] = useState<
    [number, number, number, number] | null
  >(null)
  const [selectedJoints, setSelectedJoints] = useState<string[]>([])
  const [dragStart, setDragStart] = useState<[number, number] | null>(null)

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
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
  }

  const drawPose = (ctx: CanvasRenderingContext2D) => {
    const canvasWidth = ctx.canvas.width
    const canvasHeight = ctx.canvas.height

    // Clear the canvas before drawing to avoid "imprints"
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw the grid first
    drawGrid(ctx, canvasWidth, canvasHeight)

    // Draw connections
    const connections: [string, string][] = [
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_eye', 'nose'],
      ['left_eye', 'nose'],
      ['right_ear', 'right_eye'],
      ['left_ear', 'left_eye'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['right_hip', 'left_hip'],
      ['left_shoulder', 'nose'],
      ['right_shoulder', 'nose'],
    ]

    connections.forEach(([start, end]) => {
      ctx.beginPath()
      ctx.moveTo(...joints[start])
      ctx.lineTo(...joints[end])
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 5
      ctx.stroke()
    })

    // Draw joints
    Object.entries(joints).forEach(([joint, [x, y]]) => {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = selectedJoints.includes(joint) ? 'red' : 'black' // Highlight selected joints in red
      ctx.fill()
    })

    // Draw selection box if dragging
    if (selectionBox) {
      const [x1, y1, x2, y2] = selectionBox
      ctx.beginPath()
      ctx.rect(x1, y1, x2 - x1, y2 - y1)
      ctx.strokeStyle = 'blue'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  const getJointAtPosition = (x: number, y: number) => {
    return (
      Object.entries(joints).find(([, [jointX, jointY]]) => {
        return Math.hypot(jointX - x, jointY - y) < 10 // Detect click within radius
      })?.[0] || null
    )
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const joint = getJointAtPosition(mouseX, mouseY)
      if (joint) {
        setDraggingJoint(joint)
      } else {
        setDragStart([mouseX, mouseY])
        setDraggingSelection(true)
        setSelectedJoints([])
      }
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    if (draggingJoint) {
      setJoints((prevJoints) => ({
        ...prevJoints,
        [draggingJoint]: [mouseX, mouseY],
      }))
    } else if (draggingSelection && dragStart) {
      const [startX, startY] = dragStart
      setSelectionBox([startX, startY, mouseX, mouseY])

      const smallerX = Math.min(startX, mouseX)
      const largerX = Math.max(startX, mouseX)
      const smallerY = Math.min(startY, mouseY)
      const largerY = Math.max(startY, mouseY)

      const newSelectedJoints = Object.entries(joints)
        .filter(
          ([, [x, y]]) =>
            x > smallerX && x < largerX && y > smallerY && y < largerY,
        )
        .map(([joint]) => joint)
      // console.log("NEW selected: ", newSelectedJoints, startX, startY, mouseX, mouseY);
      setSelectedJoints(newSelectedJoints)
    }
  }

  const handleMouseUp = () => {
    setDraggingJoint(null)

    if (draggingSelection) {
      setDraggingSelection(false)
      setSelectionBox(null)
    }
  }

  const handleMouseMoveSelection = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas && draggingJoint && selectedJoints.length > 0) {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

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
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        drawPose(ctx)
      }
    }
  }, [drawPose, joints, selectionBox])

  return (
    <Box>
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
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
