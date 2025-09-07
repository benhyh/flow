/**
 * Test WorkflowService Page
 * 
 * Development page to test the new WorkflowService functionality
 * Phase 1.3: Validation and testing page
 */

import { WorkflowServiceDemo } from '@/components/workflow/WorkflowServiceDemo'

export default function TestWorkflowServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WorkflowService Testing
          </h1>
          <p className="text-gray-600">
            Phase 1.3: Test the Supabase-powered workflow management system
          </p>
        </div>
        
        <WorkflowServiceDemo />
      </div>
    </div>
  )
}
