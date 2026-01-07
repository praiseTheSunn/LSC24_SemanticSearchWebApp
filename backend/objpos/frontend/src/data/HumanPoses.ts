import { halfBody, jogging, pushUp, yoga } from '../assets'
import {
  HalfBodyPoseCoor,
  InitPoseCoor,
  JoggingPoseCoor,
  PushUpPoseCoor,
  YogaPoseCoor,
} from './InitPoseCoor'
interface Pose {
  name: string
  icon: string
  joints: Record<string, [number, number]>
}

export const HumanPoses: Pose[] = [
  {
    name: 'Jogging',
    icon: jogging,
    joints: JoggingPoseCoor,
  },
  {
    name: 'Yoga',
    icon: yoga,
    joints: YogaPoseCoor,
  },
  {
    name: 'Portray',
    icon: halfBody,
    joints: HalfBodyPoseCoor,
  },
  {
    name: 'Push-up',
    icon: pushUp,
    joints: PushUpPoseCoor,
  },
]
