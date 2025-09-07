// Demo showcasing the enhanced AI nodes with target-specific tag formatting
// This demonstrates how tags are formatted differently for Trello vs Asana

import {
  formatWorkflowTags,
  mergeTagsIntoTaskData,
  previewTagFormatting,
  createTrelloLabelMapping
} from './workflow-tag-formatting'

export function demonstrateTargetSpecificFormatting() {
  console.log('🎯 Enhanced AI Nodes with Target-Specific Formatting')
  console.log('====================================================\n')

  // Sample tags from AI processing
  const aiTags = ['urgent', 'support', 'technical']
  const aiCategories = ['billing', 'question']

  console.log('📥 Input from AI Processing:')
  console.log(`   🏷️  Tags: ${aiTags.join(', ')}`)
  console.log(`   📁 Categories: ${aiCategories.join(', ')}\n`)

  // Demo 1: Trello-specific formatting
  console.log('📋 Demo 1: Trello-Only Target')
  console.log('─────────────────────────────')
  
  const trelloFormatted = formatWorkflowTags(aiTags, aiCategories, 'trello')
  console.log('✅ Formatted for Trello:')
  console.log(`   📝 Label Names: ${trelloFormatted.trello?.labelNames.join(', ')}`)
  console.log(`   📄 Description: "${trelloFormatted.trello?.description.trim()}"`)
  
  // Sample Trello task creation
  const trelloTask = {
    name: 'Customer Support Request',
    idList: 'urgent_list_123'
  }
  
  // Sample board labels mapping
  const boardLabels = [
    { id: 'lbl_urgent', name: 'Urgent', color: 'red' },
    { id: 'lbl_support', name: 'Support', color: 'blue' },
    { id: 'lbl_tech', name: 'Technical', color: 'green' },
    { id: 'lbl_billing', name: 'Billing', color: 'orange' },
    { id: 'lbl_question', name: 'Question', color: 'purple' }
  ]
  
  const labelMapping = createTrelloLabelMapping(boardLabels)
  const mergedTrelloTask = mergeTagsIntoTaskData(
    trelloTask,
    aiTags,
    aiCategories,
    'trello',
    labelMapping
  )
  
  console.log(`   🔗 Final Trello Card:`)
  console.log(`      Name: "${mergedTrelloTask.name}"`)
  console.log(`      Labels: [${mergedTrelloTask.idLabels?.join(', ')}]`)
  console.log(`      Description: "${mergedTrelloTask.desc?.split('\\n')[0]}..."\n`)

  // Demo 2: Asana-specific formatting  
  console.log('📋 Demo 2: Asana-Only Target')
  console.log('────────────────────────────')
  
  const asanaFormatted = formatWorkflowTags(aiTags, aiCategories, 'asana')
  console.log('✅ Formatted for Asana:')
  console.log(`   🔧 Custom Fields:`)
  Object.entries(asanaFormatted.asana?.customFields || {}).forEach(([key, value]) => {
    console.log(`      ${key}: ${value}`)
  })
  console.log(`   📝 Notes: "${asanaFormatted.asana?.notes.trim()}"`)
  
  // Sample Asana task creation
  const asanaTask = {
    name: 'Customer Support Request',
    projects: ['project_support_123']
  }
  
  const mergedAsanaTask = mergeTagsIntoTaskData(
    asanaTask,
    aiTags,
    aiCategories,
    'asana'
  )
  
  console.log(`   📋 Final Asana Task:`)
  console.log(`      Name: "${mergedAsanaTask.name}"`)
  console.log(`      Custom Fields: ${Object.keys(mergedAsanaTask.custom_fields).length} fields`)
  console.log(`      Notes: "${mergedAsanaTask.notes?.split('\\n')[0]}..."\n`)

  // Demo 3: Both systems (most common use case)
  console.log('📋 Demo 3: Both Systems Target')
  console.log('──────────────────────────────')
  
  const bothFormatted = formatWorkflowTags(aiTags, aiCategories, 'both')
  console.log('✅ Formatted for Both Systems:')
  console.log(`   🔷 Trello: ${bothFormatted.trello?.labelNames.length} labels + description`)
  console.log(`   🔶 Asana: ${Object.keys(bothFormatted.asana?.customFields || {}).length} custom fields + notes`)
  
  // Sample workflow that creates both
  const trelloTaskBoth = mergeTagsIntoTaskData(
    { name: 'Support Request', idList: 'list123' },
    aiTags,
    aiCategories,
    'both',
    labelMapping
  )
  
  const asanaTaskBoth = mergeTagsIntoTaskData(
    { name: 'Support Request', projects: ['proj123'] },
    aiTags,
    aiCategories,
    'both'
  )
  
  console.log(`   📊 Results:`)
  console.log(`      Trello Card: ${trelloTaskBoth.idLabels?.length} labels attached`)
  console.log(`      Asana Task: ${Object.keys(asanaTaskBoth.custom_fields).length} custom fields set\n`)

  // Demo 4: Preview system
  console.log('📋 Demo 4: Configuration Preview')
  console.log('─────────────────────────────────')
  
  const previewTrello = previewTagFormatting(aiTags, aiCategories, 'trello')
  const previewAsana = previewTagFormatting(aiTags, aiCategories, 'asana')
  const previewBoth = previewTagFormatting(aiTags, aiCategories, 'both')
  
  console.log('🔍 User sees these previews in configuration:')
  console.log(`   Trello Only: "${previewTrello.preview}"`)
  console.log(`   Asana Only: "${previewAsana.preview}"`)
  console.log(`   Both Systems: "${previewBoth.preview}"`)
  
  console.log(`\\n📊 Preview Details:`)
  console.log(`   Trello: ${previewTrello.details.join(', ')}`)
  console.log(`   Asana: ${previewAsana.details.join(', ')}`)
  console.log(`   Both: ${previewBoth.details.join(', ')}\n`)

  // Demo 5: Real workflow scenario
  console.log('📋 Demo 5: Complete Workflow Scenario')
  console.log('────────────────────────────────────')
  
  console.log('🔄 Workflow: Email → Logic → AI Tagging → Actions')
  console.log()
  console.log('1. 📧 Email arrives: "Urgent: Payment system down - billing error"')
  console.log('2. 🔍 Logic Node: Contains "urgent" → TRUE (green path)')
  console.log('3. ✨ AI Tagging Node configured for "Both Systems":')
  console.log('   - Tags detected: urgent, technical, billing')
  console.log('   - Target: Both (Trello & Asana)')
  console.log('4. 🎯 Actions execute:')
  console.log()
  
  // Simulate the workflow result
  const urgentTags = ['urgent', 'technical', 'billing']
  const urgentCategories = ['support']
  
  // Trello action
  const urgentTrelloCard = mergeTagsIntoTaskData(
    {
      name: 'URGENT: Payment system down - billing error',
      idList: 'urgent_board_list'
    },
    urgentTags,
    urgentCategories,
    'both',
    labelMapping
  )
  
  // Asana action  
  const urgentAsanaTask = mergeTagsIntoTaskData(
    {
      name: 'URGENT: Payment system down - billing error',
      projects: ['urgent_project'],
      assignee: 'senior_dev_team'
    },
    urgentTags,
    urgentCategories,
    'both'
  )
  
  console.log('   📋 Trello Card Created:')
  console.log(`      Board: Urgent Issues`)
  console.log(`      Labels: [${urgentTrelloCard.idLabels?.join(', ')}]`)
  console.log(`      Description includes workflow tags`)
  console.log()
  console.log('   📝 Asana Task Created:')
  console.log(`      Project: Urgent Issues`)
  console.log(`      Custom Fields: ${Object.keys(urgentAsanaTask.custom_fields).length} workflow tags`)
  console.log(`      Assignee: Senior Dev Team`)
  console.log(`      Notes include workflow metadata`)
  console.log()

  // Summary
  console.log('📈 Benefits of Target-Specific Formatting:')
  console.log('─────────────────────────────────────────')
  console.log('✅ Smart Adaptation: Tags formatted for each platform\'s requirements')
  console.log('✅ No Data Loss: All tag information preserved across systems')
  console.log('✅ User Choice: Configure once, works with multiple target systems')
  console.log('✅ Preview System: Users see exactly how tags will appear')
  console.log('✅ Flexible Routing: Same AI processing, different target formatting')
  console.log('✅ MVP Approach: Complex formatting hidden behind simple interface')

  return {
    trelloFormatted,
    asanaFormatted,
    bothFormatted,
    urgentTrelloCard,
    urgentAsanaTask
  }
}

// Export for testing or component use
export { demonstrateTargetSpecificFormatting as demo }
