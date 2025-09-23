'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface SelectionAreaProps {
  start: { x: number; y: number }
  end: { x: number; y: number }
  className?: string
}

export function SelectionArea({ start, end, className }: SelectionAreaProps) {
  // Calculate selection rectangle bounds
  const left = Math.min(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)

  return (
    <div
      className={cn(
        'absolute border-2 border-blue-500 bg-blue-100/20 pointer-events-none',
        'border-dashed rounded-sm',
        className
      )}
      style={{
        left,
        top,
        width,
        height,
        zIndex: 1000
      }}
    >
      {/* Selection corners for visual feedback */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
      
      {/* Selection info */}
      {width > 50 && height > 30 && (
        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}
    </div>
  )
}