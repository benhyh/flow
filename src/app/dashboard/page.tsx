'use client'

import { NodeOperationsProvider } from '@/components/workflow'
import { DashboardContent } from './DashboardContent'

export default function Dashboard() {
  return (
    <NodeOperationsProvider>
      <DashboardContent />
    </NodeOperationsProvider>
  )
}
