'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { trpc } from '@/lib/trpc/client'
import type { PersonNode } from '@/lib/types'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface NodeObject {
  id: string
  label: string
  type: string
  data: PersonNode
  x?: number
  y?: number
  color?: string
  __bckgDimensions?: [number, number]
}

interface LinkObject {
  source: string | NodeObject
  target: string | NodeObject
  type: string
}

const generationColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

function getGenerationColor(node: NodeObject): string {
  const birthYear = parseInt(node.data?.birthDate?.split('-')[0] ?? '0')
  if (birthYear >= 1980) return generationColors[0]
  if (birthYear >= 1950) return generationColors[1]
  if (birthYear >= 1920) return generationColors[2]
  if (birthYear >= 1890) return generationColors[3]
  return generationColors[4]
}

export function FamilyTree({ onNodeClick }: { onNodeClick?: (person: PersonNode) => void }) {
  const fgRef = useRef<{ zoomToFit: (ms?: number) => void } | null>(null)
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>())

  const { data: graphData, isLoading } = trpc.persons.getGraphData.useQuery()

  const handleNodeClick = useCallback((node: NodeObject) => {
    if (onNodeClick && node.data) {
      onNodeClick(node.data)
    }
  }, [onNodeClick])

  const handleNodeCanvasObject = useCallback((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label || node.data?.name || ''
    const fontSize = 12 / globalScale
    const nodeSize = 20

    // Draw circle
    ctx.beginPath()
    ctx.arc(node.x ?? 0, node.y ?? 0, nodeSize / 2, 0, 2 * Math.PI)
    ctx.fillStyle = highlightNodes.has(node.id) ? '#fbbf24' : getGenerationColor(node)
    ctx.fill()

    if (highlightNodes.has(node.id)) {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
    }

    // Draw label
    ctx.font = `${fontSize}px Sans-Serif`
    ctx.fillStyle = '#1e293b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + nodeSize / 2 + 2 / globalScale)

    node.__bckgDimensions = [nodeSize, nodeSize]
  }, [highlightNodes])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!graphData) return null

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      nodeLabel="label"
      nodeCanvasObject={handleNodeCanvasObject}
      nodeCanvasObjectMode={() => 'replace'}
      onNodeClick={handleNodeClick}
      linkLabel="type"
      linkColor={(link: LinkObject) => link.type === 'MARRIED_TO' ? '#ec4899' : '#94a3b8'}
      linkWidth={1.5}
      onEngineStop={() => fgRef.current?.zoomToFit(400)}
      backgroundColor="#f8fafc"
    />
  )
}
