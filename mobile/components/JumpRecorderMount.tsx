import { useJumpRecorder } from '../hooks/useJumpRecorder'

// Mounts the jump recorder into the component tree with no visible output.
export function JumpRecorderMount() {
  useJumpRecorder()
  return null
}
