# Workflow Use Case Guide: Customer Support Email Automation

## 🎯 Business Problem
Your company receives 100+ customer emails daily to support@company.com. Currently, your team manually:
- Reads each email to determine urgency
- Categorizes emails by type (technical, billing, general)
- Creates tasks in different tools based on priority
- Routes urgent issues to senior team members

**Result**: Delayed response times, missed urgent issues, inconsistent categorization.

## 💡 Solution: Automated Email Workflow
Using our Logic & AI Nodes, we'll create an intelligent workflow that automatically processes incoming emails and routes them appropriately.

---

## 📋 Complete Workflow Setup Guide

### Step 1: Create the Email Trigger
1. **Drag** the "New Email" trigger from the Node Library
2. **Double-click** to configure:
   - Email: `support@company.com`
   - Webhook URL: (automatically generated)
3. **Save** configuration

### Step 2: Add Logic Node for Urgency Check
1. **Drag** the "If Condition" logic node onto canvas
2. **Connect** email trigger output to logic node input
3. **Double-click** the logic node to configure:
   - **Field**: Email Subject
   - **Condition**: Contains
   - **Value**: `urgent`
4. **Save** configuration

The logic node now has two outputs:
- **Green handle (True)**: Email subject contains "urgent"
- **Red handle (False)**: Email subject doesn't contain "urgent"

### Step 3: Configure AI Tagging for Urgent Emails
1. **Drag** "AI Tagging" node onto canvas
2. **Connect** logic node's **GREEN** output to AI tagging input
3. **Double-click** AI tagging node to configure:
   
   **Select these tags:**
   - ☑️ Urgent (Priority)
   - ☑️ Support (Department)
   - ☑️ Technical (if needed)
   
   **Keyword rules** (auto-populated):
   - **Urgent**: `urgent, asap, emergency, critical, immediate`
   - **Support**: `support, help, issue, problem, bug`
   - **Technical**: `technical, api, bug, error, code, integration`

4. **Save** configuration

### Step 4: Configure AI Classification for Normal Emails
1. **Drag** "AI Classification" node onto canvas
2. **Connect** logic node's **RED** output to AI classification input
3. **Double-click** AI classification node to configure:
   
   **Select these categories:**
   - ☑️ Technical Support
   - ☑️ Billing Support
   - ☑️ General Support
   - ☑️ New Lead
   - ☑️ General Inquiry
   
   **Keyword rules**:
   - **Technical**: `api, integration, bug, error, technical`
   - **Billing**: `billing, invoice, payment, charge, subscription`
   - **General**: `help, question, issue, problem, support`
   - **New Lead**: `interested, pricing, demo, trial, purchase`
   - **Inquiry**: `information, learn more, features, capabilities`

4. **Save** configuration

### Step 5: Create High-Priority Action (Urgent Path)
1. **Drag** "Create Trello Card" action onto canvas
2. **Connect** AI tagging output to Trello action input
3. **Double-click** to configure:
   - **Board ID**: Your urgent issues board
   - **List**: "🚨 URGENT - Immediate Response"
   - **Title**: Uses email subject with tags
   - **Description**: Email body + applied tags

### Step 6: Create Normal Priority Action (Normal Path)
1. **Drag** "Create Asana Task" action onto canvas
2. **Connect** AI classification output to Asana action input
3. **Double-click** to configure:
   - **Project**: "Customer Support Queue"
   - **Title**: Email subject with category
   - **Notes**: Email body + classification
   - **Priority**: Normal

---

## 🔄 How the Workflow Processes Emails

### Example 1: Urgent Email
**Incoming Email:**
```
From: admin@client.com
Subject: Urgent: Payment system is down - customers can't purchase!
Body: Hi support team, our payment processing has been down for 30 minutes. 
      This is affecting all our customers who are trying to make purchases. 
      Please help us resolve this ASAP!
```

**Workflow Processing:**
1. **Email Trigger** → Receives email
2. **Logic Node** → Checks "Urgent" in subject → **TRUE** (Green path)
3. **AI Tagging** → Analyzes content → Applies tags: `urgent`, `support`, `technical`
4. **Trello Action** → Creates card in urgent board:
   - **Title**: "🚨 URGENT: Payment system is down - customers can't purchase!"
   - **Tags**: urgent, support, technical
   - **Board**: Urgent Issues
   - **Assigned**: Senior developer team

**Result**: Issue escalated immediately, senior team notified within minutes!

### Example 2: Normal Support Email
**Incoming Email:**
```
From: user@company.com
Subject: Question about API rate limits
Body: Hello, I'm integrating with your API and wondering about the rate limits 
      for the premium plan. Could you provide more details about the quotas?
```

**Workflow Processing:**
1. **Email Trigger** → Receives email
2. **Logic Node** → Checks "Urgent" in subject → **FALSE** (Red path)
3. **AI Classification** → Analyzes content → Categories: `technical`, `inquiry`
4. **Asana Action** → Creates task:
   - **Title**: "Question about API rate limits [Technical, Inquiry]"
   - **Project**: Customer Support Queue
   - **Priority**: Normal
   - **Assigned**: Technical support team

**Result**: Properly categorized and routed to appropriate team member.

### Example 3: Sales Inquiry
**Incoming Email:**
```
From: prospect@newcompany.com
Subject: Interested in your premium pricing plans
Body: Hi, we're a growing startup and interested in learning more about your 
      premium features and pricing. Could someone schedule a demo call?
```

**Workflow Processing:**
1. **Email Trigger** → Receives email
2. **Logic Node** → Checks "Urgent" in subject → **FALSE** (Red path)
3. **AI Classification** → Analyzes content → Categories: `sales`, `lead`
4. **Asana Action** → Creates task:
   - **Title**: "Interested in your premium pricing plans [Sales, Lead]"
   - **Project**: Sales Pipeline
   - **Priority**: High (for leads)
   - **Assigned**: Sales team

**Result**: Qualified lead immediately routed to sales team for follow-up.

---

## ⚙️ Advanced Configuration Tips

### Fine-tuning Logic Conditions
- **Multiple conditions**: Add more logic nodes for complex routing
- **Different operators**: 
  - `startsWith` for email prefixes like "[URGENT]"
  - `contains` for keywords anywhere in content
  - `equals` for exact matches

### Optimizing AI Keywords
- **Monitor results**: Check which emails get missed or misclassified
- **Add synonyms**: Include variations like "critical" = "urgent"
- **Business-specific terms**: Add your product names, common issues

### Workflow Variations
1. **Priority Levels**: 
   - High → Trello urgent board
   - Medium → Asana normal project
   - Low → Automated response + later review

2. **Team Routing**:
   - Technical → Development team board
   - Billing → Finance team tasks
   - Sales → CRM integration

3. **Time-based Logic**:
   - After hours → Different escalation path
   - Weekends → Automated acknowledgment

---

## 📊 Expected Results

### Before Automation:
- ⏱️ **Response Time**: 2-4 hours average
- 😰 **Missed Urgent Issues**: 15% slip through
- 🎯 **Categorization Accuracy**: 70% (manual errors)
- 👥 **Team Efficiency**: 60% time spent on email sorting

### After Automation:
- ⚡ **Response Time**: 5-15 minutes for urgent, 1 hour for normal
- 🎯 **Missed Urgent Issues**: <2% (automated detection)
- 📈 **Categorization Accuracy**: 85-90% (consistent rules)
- 🚀 **Team Efficiency**: 90% time spent on actual problem-solving

### ROI Calculation:
- **Time Saved**: 2-3 hours/day per support member
- **Faster Resolution**: Improved customer satisfaction
- **Fewer Escalations**: Issues caught and routed correctly
- **Team Morale**: Less manual sorting, more meaningful work

---

## 🔧 Troubleshooting & Testing

### Testing Your Workflow
1. **Use Mock Data**: Send test emails with known keywords
2. **Check Routing**: Verify urgent emails go to correct path
3. **Validate Tags**: Ensure AI nodes apply expected tags/categories
4. **Monitor Actions**: Confirm tasks created in correct tools

### Common Issues
- **Keywords too specific**: Add broader terms
- **Missing connections**: Check all nodes are connected
- **Wrong routing**: Verify logic condition operators
- **Tags not applying**: Check keyword spelling and casing

### Monitoring Success
- Track response times before/after
- Monitor customer satisfaction scores
- Count missed urgent issues
- Measure team productivity gains

---

## 🚀 Next Steps

1. **Deploy Workflow**: Save and activate your email automation
2. **Monitor Performance**: Watch first week of automated processing
3. **Refine Keywords**: Adjust based on real email patterns
4. **Scale Up**: Add more sophisticated logic as needed
5. **Team Training**: Show team how to use new automated system

Your customer support team will now have an intelligent email processing system that works 24/7, ensuring no urgent issue goes unnoticed and every email is properly categorized and routed! 🎉
