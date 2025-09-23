'use client'

import React, { useMemo, useCallback } from 'react'
import { WorkflowConnection } from '@/lib/types/unified-workflow'
import { cn } from '@/lib/utils'
import { getConnectionCondition } from '@/lib/utils/workflow-migration'

export interface WorkflowConnectionLineProps {
  connection: WorkflowConnection
  sourcePosition: { x: number; y: number }
  targetPosition: { x: number; y: number }
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<WorkflowConnection>) => void
  readonly?: boolean
  mode?: 'simple' | 'enhanced' | 'advanced'
}

export function WorkflowConnectionLine({
  connection,
  sourcePosition,
  targetPosition,
  isSelected,
  onSelect,
  onUpdate,
  readonly = false,
  mode = 'enhanced'
}: WorkflowConnectionLineProps) {
  // Calculate connection path
  const pathData = useMemo(() => {
    const sourceX = sourcePosition.x + 120 // Node width offset
    const sourceY = sourcePosition.y + 40  // Node height center
    const targetX = targetPosition.x
    const targetY = targetPosition.y + 40

    // Create a smooth curved path
    const controlPointOffset = Math.abs(targetX - sourceX) * 0.5
    const controlPoint1X = sourceX + controlPointOffset
    const controlPoint2X = targetX - controlPointOffset

    return `M ${sourceX} ${sourceY} C ${controlPoint1X} ${sourceY} ${controlPoint2X} ${targetY} ${targetX} ${targetY}`
  }, [sourcePosition, targetPosition])

  // Calculate arrow position and rotation
  const arrowTransform = useMemo(() => {
    const sourceX = sourcePosition.x + 120
    const sourceY = sourcePosition.y + 40
    const targetX = targetPosition.x
    const targetY = targetPosition.y + 40

    // Calculate angle for arrow rotation
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI)
    
    // Position arrow at the target point
    return `translate(${targetX}, ${targetY}) rotate(${angle})`
  }, [sourcePosition, targetPosition])

  // Calculate label position (midpoint of connection)
  const labelPosition = useMemo(() => {
    const sourceX = sourcePosition.x + 120
    const sourceY = sourcePosition.y + 40
    const targetX = targetPosition.x
    const targetY = targetPosition.y + 40

    return {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2
    }
  }, [sourcePosition, targetPosition])

  // Handle connection click
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }, [onSelect])

  // Handle label editing
  const handleLabelEdit = useCallback(() => {
    if (readonly) return
    
    const newLabel = prompt('Enter connection label:', connection.label || '')
    if (newLabel !== null) {
      onUpdate({ label: newLabel })
    }
  }, [readonly, connection.label, onUpdate])

  // Handle label double click for editing
  const handleLabelDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    handleLabelEdit()
  }, [handleLabelEdit])

  // Check if connection has conditions (supports both old and new formats)
  const hasConditions = useMemo(() => {
    // Check new conditions format
    if (connection.conditions && Object.keys(connection.conditions).length > 0) {
      return true
    }
    // Check legacy condition format
    if (connection.condition && connection.condition.trim() !== '') {
      return true
    }
    return false
  }, [connection.conditions, connection.condition])

  // Get the effective condition for display
  const effectiveCondition = useMemo(() => {
    return getConnectionCondition(connection)
  }, [connection])

  return (
    <g className="workflow-connection">
      {/* Connection Path */}
      <path
        d={pathData}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#6b7280'}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={hasConditions ? '5,5' : 'none'}
        className={cn(
          'transition-all duration-200 cursor-pointer',
          !readonly && 'hover:stroke-blue-400',
          isSelected && 'drop-shadow-sm'
        )}
        onClick={handleClick}
      />

      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="cursor-pointer"
        onClick={handleClick}
      />

      {/* Arrow */}
      <g transform={arrowTransform}>
        <polygon
          points="-8,-4 0,0 -8,4"
          fill={isSelected ? '#3b82f6' : '#6b7280'}
          className="transition-colors duration-200"
        />
      </g>

      {/* Connection Label */}
      {connection.label && mode !== 'simple' && (
        <g>
          {/* Label Background */}
          <rect
            x={labelPosition.x - (connection.label.length * 4)}
            y={labelPosition.y - 8}
            width={connection.label.length * 8}
            height={16}
            fill="white"
            stroke={isSelected ? '#3b82f6' : '#d1d5db'}
            strokeWidth={1}
            rx={4}
            className={cn(
              'transition-all duration-200',
              !readonly && 'cursor-pointer hover:stroke-blue-400'
            )}
            onClick={handleClick}
            onDoubleClick={handleLabelDoubleClick}
          />
          
          {/* Label Text */}
          <text
            x={labelPosition.x}
            y={labelPosition.y + 3}
            textAnchor="middle"
            className={cn(
              'text-xs font-medium pointer-events-none select-none',
              isSelected ? 'fill-blue-600' : 'fill-gray-600'
            )}
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Conditional Indicator */}
      {hasConditions && mode === 'advanced' && (
        <circle
          cx={labelPosition.x + (connection.label ? connection.label.length * 4 + 10 : 0)}
          cy={labelPosition.y}
          r={6}
          fill={isSelected ? '#3b82f6' : '#f59e0b'}
          stroke="white"
          strokeWidth={2}
          className="transition-colors duration-200"
        >
          <title>Conditional Connection</title>
        </circle>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <g>
          {/* Selection handles */}
          <circle
            cx={sourcePosition.x + 120}
            cy={sourcePosition.y + 40}
            r={4}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={2}
          />
          <circle
            cx={targetPosition.x}
            cy={targetPosition.y + 40}
            r={4}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={2}
          />
        </g>
      )}
    </g>
  )
}