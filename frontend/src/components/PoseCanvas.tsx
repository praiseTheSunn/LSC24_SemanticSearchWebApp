import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

const PoseCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
  });
  const [draggingJoint, setDraggingJoint] = useState<string | null>(null);

  const drawPose = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw joints
    Object.entries(joints).forEach(([joint, [x, y]]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();
      // joints radius
      // ctx.fillText(joint, x + 10, y);
    });

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
    ];

    connections.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(...joints[start]);
      ctx.lineTo(...joints[end]);
      ctx.strokeStyle = 'black';
      // stroke width
      ctx.lineWidth = 5;
      ctx.stroke();
    });
  };

  const getJointAtPosition = (x: number, y: number) => {
    return Object.entries(joints).find(([joint, [jointX, jointY]]) => {
      return Math.hypot(jointX - x, jointY - y) < 10; // Detect click within radius
    })?.[0] || null;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const joint = getJointAtPosition(mouseX, mouseY);
      if (joint) {
        setDraggingJoint(joint);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingJoint) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        setJoints((prevJoints) => ({
          ...prevJoints,
          [draggingJoint]: [mouseX, mouseY],
        }));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingJoint(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawPose(ctx);
      }
    }
  }, [joints]);

  return (
    <Box>
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        style={{ border: '1px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </Box>
  );
};

export default PoseCanvas;
