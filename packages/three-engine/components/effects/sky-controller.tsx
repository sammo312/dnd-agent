"use client"

import { Sky } from "@react-three/drei"

interface SkyControllerProps {
  detailLevel: number
  firstPersonActive: boolean
  fallbackColor?: string
}

export function SkyController({
  detailLevel,
  firstPersonActive,
  fallbackColor = "#1e3d59",
}: SkyControllerProps) {
  const showSky = detailLevel > 0.4 || firstPersonActive
  const skyColor = detailLevel > 0.3 || firstPersonActive ? "#87ceeb" : fallbackColor

  if (showSky) {
    return (
      <Sky
        sunPosition={[100, 20, 100]}
        turbidity={10}
        rayleigh={0.4}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
    )
  }

  return <color attach="background" args={[skyColor]} />
}
