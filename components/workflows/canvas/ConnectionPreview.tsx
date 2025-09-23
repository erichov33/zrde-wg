'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'

export interface ConnectionPreviewProps {
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  isValid: boolean
  connectionType?: 'default' | 'conditional' | 'error'
  className?: string
}

export function ConnectionPreview({
  startPosition,
  currentPosition,
  isValid,
  connectionType = 'default',
  className
}: ConnectionPreviewProps) {
  // Calculate connection path
  const pathData = useMemo(() => {
    const sourceX = startPosition.x
    const sourceY = startPosition.y
    const targetX = currentPosition.x
    const targetY = currentPosition.y

    // Calculate control points for smooth curve
    const deltaX = targetX - sourceX
    const deltaY = targetY - sourceY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Adaptive control point distance
    const controlDistance = Math.min(distance * 0.4, 100)
    
    const sourceControlX = sourceX + controlDistance
    const sourceControlY = sourceY
    const targetControlX = targetX - controlDistance
    const targetControlY = targetY

    return `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY}, ${targetControlX} ${targetControlY}, ${targetX} ${targetY}`
  }, [startPosition, currentPosition])

  // Calculate arrow position and rotation
  const arrowTransform = useMemo(() => {
    const deltaX = currentPosition.x - startPosition.x
    const deltaY = currentPosition.y - startPosition.y
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
    
    return `translate(${currentPosition.x}, ${currentPosition.y}) rotate(${angle})`
  }, [startPosition, currentPosition])

  // Get colors based on validity and type
  const getColors = () => {
    if (!isValid) {
      return {
        stroke: '#ef4444',
        fill: '#ef4444',
        opacity: 0.7
      }
    }

    switch (connectionType) {
      case 'conditional':
        return {
          stroke: '#f59e0b',
          fill: '#f59e0b',
          opacity: 0.8
        }
      case 'error':
        return {
          stroke: '#dc2626',
          fill: '#dc2626',
          opacity: 0.8
        }
      default:
        return {
          stroke: '#3b82f6',
          fill: '#3b82f6',
          opacity: 0.8
        }
    }
  }

  const colors = getColors()

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)} style={{ zIndex: 999 }}>
      <svg className="w-full h-full">
        {/* Connection Path */}
        <path
          d={pathData}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={3}
          strokeOpacity={colors.opacity}
          strokeDasharray={connectionType === 'conditional' ? '8,4' : connectionType === 'error' ? '4,4' : 'none'}
          className="transition-all duration-150"
        />

        {/* Arrow */}
        <g transform={arrowTransform} opacity={colors.opacity}>
          <polygon
            points="-12,-6 0,0 -12,6"
            fill={colors.fill}
            className="transition-all duration-150"
          />
        </g>

        {/* Start point indicator */}
        <circle
          cx={startPosition.x}
          cy={startPosition.y}
          r={4}
          fill={colors.fill}
          stroke="white"
          strokeWidth={2}
          opacity={colors.opacity}
          className="transition-all duration-150"
        />

        {/* End point indicator (when valid) */}
        {isValid && (
          <circle
            cx={currentPosition.x}
            cy={currentPosition.y}
            r={6}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={3}
            opacity={colors.opacity}
            className="transition-all duration-150"
          />
        )}

        {/* Invalid connection indicator */}
        {!isValid && (
          <g transform={`translate(${currentPosition.x}, ${currentPosition.y})`}>
            <circle
              r={8}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
              opacity={0.7}
            />
            <path
              d="M -4,-4 L 4,4 M 4,-4 L -4,4"
              stroke="#ef4444"
              strokeWidth={2}
              opacity={0.7}
            />
          </g>
        )}

        {/* Connection type indicator */}
        {connectionType !== 'default' && isValid && (
          <g transform={`translate(${(startPosition.x + currentPosition.x) / 2}, ${(startPosition.y + currentPosition.y) / 2 - 15})`}>
            <rect
              x={-15}
              y={-8}
              width={30}
              height={16}
              fill="white"
              stroke={colors.stroke}
              strokeWidth={1}
              rx={4}
              opacity={0.9}
            />
            <text
              textAnchor="middle"
              y={3}
              className="text-xs font-medium"
              fill={colors.stroke}
            >
              {connectionType === 'conditional' ? 'IF' : 'ERR'}
            </text>
          </g>
        )}

        {/* Distance indicator for long connections */}
        {(() => {
          const distance = Math.sqrt(
            Math.pow(currentPosition.x - startPosition.x, 2) + 
            Math.pow(currentPosition.y - startPosition.y, 2)
          )
          
          if (distance > 200 && isValid) {
            return (
              <g transform={`translate(${(startPosition.x + currentPosition.x) / 2}, ${(startPosition.y + currentPosition.y) / 2 + 20})`}>
                <rect
                  x={-20}
                  y={-8}
                  width={40}
                  height={16}
                  fill="rgba(0,0,0,0.8)"
                  rx={4}
                />
                <text
                  textAnchor="middle"
                  y={3}
                  className="text-xs font-mono"
                  fill="white"
                >
                  {Math.round(distance)}px
                </text>
              </g>
            )
          }
          return null
        })()}
      </svg>
    </div>
  )
}