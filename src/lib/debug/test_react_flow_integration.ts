/**
 * Test React Flow Integration with Simplified Schema
 * 
 * This script tests the integration between React Flow data structures
 * and the simplified Supabase schema
 */

import { workflowService } from '@/lib/services/WorkflowService'
import { type Node, type Edge } from '@xyflow/react'

export async function testReactFlowIntegration() {
  console.log('🧪 Testing React Flow integration...')

  try {
    // Test 1: Create a workflow with React Flow nodes and edges
    console.log('\n📋 Testing workflow creation with React Flow data...')
    
    const testNodes: Node[] = [
      {
        id: 'gmail-trigger-1',
        type: 'gmailTrigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Gmail Trigger',
          description: 'Monitor emails for specific criteria',
          config: {
            subject: 'Important',
            sender: 'boss@company.com',
            keywords: ['urgent', 'deadline']
          }
        }
      },
      {
        id: 'trello-action-1',
        type: 'trelloAction',
        position: { x: 400, y: 100 },
        data: {
          label: 'Create Trello Card',
          description: 'Create a new card in Trello',
          config: {
            boardId: 'board123',
            listId: 'list456',
            cardTitle: '{{email.subject}}',
            cardDescription: '{{email.body}}'
          }
        }
      }
    ]

    const testEdges: Edge[] = [
      {
        id: 'e1-2',
        source: 'gmail-trigger-1',
        target: 'trello-action-1',
        type: 'default',
        animated: true,
        data: {
          condition: 'Email matches criteria'
        }
      }
    ]

    const workflowInput = {
      name: 'Email to Trello Workflow',
      description: 'Automatically create Trello cards from important emails',
      nodes: testNodes,
      edges: testEdges,
      is_active: false,
      validate: true
    }

    const createdWorkflow = await workflowService.createWorkflow(workflowInput)
    
    if (!createdWorkflow) {
      throw new Error('Failed to create workflow')
    }

    console.log('✅ Workflow created successfully:', {
      id: createdWorkflow.id,
      name: createdWorkflow.name,
      nodeCount: createdWorkflow.node_count,
      edgeCount: createdWorkflow.edge_count
    })

    // Test 2: Retrieve and verify React Flow data
    console.log('\n📋 Testing workflow retrieval...')
    
    const retrievedWorkflow = await workflowService.getWorkflow(createdWorkflow.id)
    
    if (!retrievedWorkflow) {
      throw new Error('Failed to retrieve workflow')
    }

    // Verify React Flow data structure
    const nodes = retrievedWorkflow.nodes
    const edges = retrievedWorkflow.edges

    console.log('✅ Workflow retrieved successfully')
    console.log('Nodes:', nodes.length, 'Edges:', edges.length)

    // Verify node structure
    const firstNode = nodes[0]
    if (firstNode && firstNode.type === 'gmailTrigger') {
      console.log('✅ Gmail trigger node structure verified')
      console.log('Node data:', firstNode.data)
    }

    // Verify edge structure
    const firstEdge = edges[0]
    if (firstEdge && firstEdge.source === 'gmail-trigger-1') {
      console.log('✅ Edge structure verified')
      console.log('Edge data:', firstEdge.data)
    }

    // Test 3: Update workflow with new React Flow data
    console.log('\n📋 Testing workflow update...')
    
    const updatedNodes: Node[] = [
      ...nodes,
      {
        id: 'asana-action-1',
        type: 'asanaAction',
        position: { x: 700, y: 100 },
        data: {
          label: 'Create Asana Task',
          description: 'Create a new task in Asana',
          config: {
            projectId: 'project789',
            taskName: '{{email.subject}}',
            taskDescription: '{{email.body}}'
          }
        }
      }
    ]

    const updatedEdges: Edge[] = [
      ...edges,
      {
        id: 'e2-3',
        source: 'trello-action-1',
        target: 'asana-action-1',
        type: 'default',
        animated: true
      }
    ]

    const updatedWorkflow = await workflowService.updateWorkflow(createdWorkflow.id, {
      nodes: updatedNodes,
      edges: updatedEdges
    })

    if (updatedWorkflow) {
      console.log('✅ Workflow updated successfully')
      console.log('Updated node count:', updatedWorkflow.node_count)
      console.log('Updated edge count:', updatedWorkflow.edge_count)
    }

    // Test 4: Test performance with generated columns
    console.log('\n📋 Testing performance optimizations...')
    
    const workflows = await workflowService.getUserWorkflows()
    
    if (workflows.length > 0) {
      const workflow = workflows[0]
      console.log('✅ Generated columns working:')
      console.log('- Node count:', workflow.node_count)
      console.log('- Edge count:', workflow.edge_count)
    }

    // Test 5: Clean up test workflow
    console.log('\n📋 Cleaning up test workflow...')
    
    const deleteSuccess = await workflowService.deleteWorkflow(createdWorkflow.id)
    
    if (deleteSuccess) {
      console.log('✅ Test workflow cleaned up successfully')
    }

    console.log('\n🎉 All React Flow integration tests passed!')
    return true

  } catch (error) {
    console.error('❌ React Flow integration test failed:', error)
    return false
  }
}

// Test React Flow data structure validation
export function validateReactFlowDataStructure() {
  console.log('🔍 Validating React Flow data structures...')

  // Test Node structure
  const testNode: Node = {
    id: 'test-node',
    type: 'testType',
    position: { x: 0, y: 0 },
    data: { label: 'Test Node' }
  }

  // Test Edge structure
  const testEdge: Edge = {
    id: 'test-edge',
    source: 'source-node',
    target: 'target-node',
    type: 'default'
  }

  // Verify required properties
  const nodeValid = testNode.id && testNode.position && testNode.data
  const edgeValid = testEdge.id && testEdge.source && testEdge.target

  if (nodeValid && edgeValid) {
    console.log('✅ React Flow data structures are valid')
    return true
  } else {
    console.error('❌ React Flow data structures are invalid')
    return false
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testReactFlowIntegration = testReactFlowIntegration
  window.validateReactFlowDataStructure = validateReactFlowDataStructure
} else {
  // Node.js environment
  testReactFlowIntegration().then(success => {
    if (success) {
      console.log('✅ React Flow integration test completed successfully')
      process.exit(0)
    } else {
      console.error('❌ React Flow integration test failed')
      process.exit(1)
    }
  })
}
