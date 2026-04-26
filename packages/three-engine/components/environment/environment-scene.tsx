"use client"

import { useMemo } from "react"
import { RunescapeTree } from "./runescape-tree"
import { RunescapeRock } from "./runescape-rock"
import { RunescapeBush } from "./runescape-bush"
import { FencePost } from "./fence-post"

interface EnvironmentSceneProps {
  /** Opacity 0-1, controls fade-in of environment */
  opacity?: number
  /** Ground color hex string */
  groundColor?: string
  /** Whether to show the environment at all */
  visible?: boolean
}

export function EnvironmentScene({
  opacity = 1,
  groundColor = "#3d7a3d",
  visible = true,
}: EnvironmentSceneProps) {
  const trees = useMemo(
    () => [
      { pos: [-7, 0, -5] as [number, number, number], scale: 1.3 },
      { pos: [-6, 0, 3] as [number, number, number], scale: 1.0 },
      { pos: [7, 0, -4] as [number, number, number], scale: 1.2 },
      { pos: [6, 0, 5] as [number, number, number], scale: 1.1 },
      { pos: [-5, 0, -7] as [number, number, number], scale: 0.9 },
      { pos: [5, 0, -6] as [number, number, number], scale: 1.0 },
      { pos: [0, 0, 7] as [number, number, number], scale: 1.4 },
      { pos: [-8, 0, 0] as [number, number, number], scale: 1.1 },
      { pos: [8, 0, 1] as [number, number, number], scale: 0.95 },
      { pos: [-3, 0, 8] as [number, number, number], scale: 1.0 },
      { pos: [4, 0, 7] as [number, number, number], scale: 0.8 },
      { pos: [-7, 0, 6] as [number, number, number], scale: 0.85 },
    ],
    []
  )

  const rocks = useMemo(
    () => [
      { pos: [-5, 0, 1] as [number, number, number], scale: 1.2 },
      { pos: [5, 0, -2] as [number, number, number], scale: 0.9 },
      { pos: [2, 0, 6] as [number, number, number], scale: 1.0 },
      { pos: [-4, 0, -5] as [number, number, number], scale: 0.8 },
      { pos: [6, 0, 3] as [number, number, number], scale: 1.1 },
    ],
    []
  )

  const bushes = useMemo(
    () => [
      { pos: [-4, 0, 4] as [number, number, number], scale: 1.0 },
      { pos: [4, 0, 4] as [number, number, number], scale: 0.8 },
      { pos: [-6, 0, -3] as [number, number, number], scale: 1.2 },
      { pos: [3, 0, -5] as [number, number, number], scale: 0.9 },
      { pos: [-2, 0, 6] as [number, number, number], scale: 1.1 },
      { pos: [7, 0, -1] as [number, number, number], scale: 0.85 },
    ],
    []
  )

  const fencePosts = useMemo(() => {
    const posts: [number, number, number][] = []
    for (let i = 0; i < 8; i++) {
      posts.push([-9 + i * 2.5, 0, -9])
      posts.push([-9 + i * 2.5, 0, 9])
    }
    return posts
  }, [])

  if (!visible || opacity <= 0) return null

  return (
    <group>
      {/* Ground */}
      <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40, 8, 8]} />
        <meshStandardMaterial color={groundColor} flatShading transparent opacity={opacity} />
      </mesh>

      {/* Dirt path */}
      <mesh position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 30]} />
        <meshStandardMaterial color="#8b7355" flatShading transparent opacity={opacity} />
      </mesh>

      {opacity > 0.1 &&
        trees.map((tree, i) => (
          <RunescapeTree key={`tree-${i}`} position={tree.pos} scale={tree.scale * opacity} />
        ))}

      {opacity > 0.1 &&
        rocks.map((rock, i) => (
          <RunescapeRock key={`rock-${i}`} position={rock.pos} scale={rock.scale * opacity} />
        ))}

      {opacity > 0.1 &&
        bushes.map((bush, i) => (
          <RunescapeBush key={`bush-${i}`} position={bush.pos} scale={bush.scale * opacity} />
        ))}

      {opacity > 0.1 &&
        fencePosts.map((pos, i) => <FencePost key={`fence-${i}`} position={pos} />)}

      {/* Water pond */}
      <mesh position={[-6, -0.13, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 6]} />
        <meshStandardMaterial color="#4a90a4" flatShading transparent opacity={0.8 * opacity} />
      </mesh>
    </group>
  )
}
