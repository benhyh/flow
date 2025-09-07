# Step-by-Step: Building Your First Intelligent Workflow

## 🎯 What We're Building
A smart email processing system that automatically:
- Detects urgent emails
- Applies relevant tags 
- Routes to appropriate teams
- Creates tasks in the right tools

---

## 📋 Step-by-Step Instructions

### Step 1: Start with Email Trigger
```
1. Open the workflow builder
2. From Node Library → Triggers section
3. Drag "New Email" onto the canvas
4. Double-click the email node
5. Configure:
   📧 Email: support@yourcompany.com
   🔗 Webhook: (auto-generated)
6. Click "Save Configuration"
```

**Result**: You now have an email trigger that activates when emails arrive.

---

### Step 2: Add the "If" Logic Node
```
1. From Node Library → Logic & Filters section
2. Drag "If Condition" onto canvas (to the right of email)
3. Connect: Email output → Logic input (drag from blue dot to blue dot)
4. Double-click the logic node
5. Configure:
   📋 Field to Check: "Email Subject"
   🔍 Condition: "Contains" 
   💬 Value: "urgent"
6. Click "Save Configuration"
```

**Result**: Now you have branching logic - urgent emails go one way, normal emails another.

**Visual**: You'll see two output handles:
- 🟢 Green handle (True) = Email IS urgent
- 🔴 Red handle (False) = Email is NOT urgent

---

### Step 3: Handle Urgent Emails (Green Path)
```
1. From Node Library → AI Nodes section
2. Drag "AI Tagging" onto canvas (below the green handle)
3. Connect: Logic green output → AI Tagging input
4. Double-click AI Tagging node
5. Select tags:
   ☑️ Urgent (Priority category)
   ☑️ Support (Department category) 
   ☑️ Technical (Type category - if applicable)
6. Customize keywords if needed:
   🔥 Urgent: "urgent, asap, emergency, critical, immediate"
   🆘 Support: "support, help, issue, problem, bug"
7. Click "Save Configuration"
```

**Result**: Urgent emails get tagged automatically for high-priority routing.

---

### Step 4: Handle Normal Emails (Red Path)
```
1. From Node Library → AI Nodes section
2. Drag "AI Classification" onto canvas (below the red handle)
3. Connect: Logic red output → AI Classification input
4. Double-click AI Classification node
5. Select categories:
   ☑️ Technical Support
   ☑️ Billing Support  
   ☑️ General Support
   ☑️ Sales Lead
   ☑️ General Inquiry
6. Keywords auto-populate, customize if needed:
   🔧 Technical: "api, integration, bug, error, code"
   💰 Billing: "billing, invoice, payment, subscription"
   📞 Sales: "pricing, demo, trial, purchase"
7. Click "Save Configuration"
```

**Result**: Normal emails get properly categorized for appropriate routing.

---

### Step 5: Create High-Priority Action
```
1. From Node Library → Actions section
2. Drag "Create Trello Card" onto canvas (right of AI Tagging)
3. Connect: AI Tagging output → Trello Action input
4. Double-click Trello action
5. Configure (if not already connected):
   🔗 Authorize Trello integration
   📋 Board ID: Your "Urgent Issues" board
   📝 List: "🚨 Immediate Response Needed"
   🏷️ Card Title: Will include email subject + tags
6. Click "Save Configuration"
```

**Result**: Urgent emails automatically create high-priority Trello cards.

---

### Step 6: Create Normal Priority Action
```
1. From Node Library → Actions section  
2. Drag "Create Asana Task" onto canvas (right of AI Classification)
3. Connect: AI Classification output → Asana Action input
4. Double-click Asana action
5. Configure (if not already connected):
   🔗 Authorize Asana integration
   📊 Project: "Customer Support Queue"
   📝 Task Title: Will include email subject + categories
   ⚡ Priority: Normal
6. Click "Save Configuration"
```

**Result**: Normal emails create properly categorized Asana tasks.

---

### Step 7: Test Your Workflow
```
1. Click "Save Workflow" in top toolbar
2. Name it: "Smart Email Support Routing"
3. Click "Test Workflow" or send a test email to your configured address
4. Watch the workflow execute:
   📧 Email arrives → 🔍 Logic check → ✨ AI processing → ✅ Action created
```

---

## 🎮 Interactive Testing Examples

### Test Case 1: Urgent Email
Send this test email to your configured address:
```
Subject: Urgent: Website is completely down!
Body: Hi support team, our entire website has been down for 45 minutes. 
      Customers are calling and we're losing sales. Please help immediately!
```

**Expected Flow**:
1. Email Trigger activates
2. Logic Node: "contains urgent" = TRUE → Green path  
3. AI Tagging: Applies "urgent", "support", "technical" tags
4. Trello Action: Creates card in urgent board

### Test Case 2: Normal Support Email  
```
Subject: Question about password reset
Body: Hello, I'm having trouble resetting my password. The reset email 
      isn't arriving. Could someone help me with this?
```

**Expected Flow**:
1. Email Trigger activates
2. Logic Node: "contains urgent" = FALSE → Red path
3. AI Classification: Categories "technical", "general"  
4. Asana Action: Creates normal priority task

### Test Case 3: Sales Inquiry
```
Subject: Interested in enterprise plan
Body: Hi, we're a 200-person company looking at your enterprise features. 
      Could someone schedule a demo call this week?
```

**Expected Flow**:
1. Email Trigger activates
2. Logic Node: "contains urgent" = FALSE → Red path
3. AI Classification: Categories "sales", "lead"
4. Asana Action: Creates task assigned to sales team

---

## ✅ Success Checklist

After building your workflow, verify:

- [ ] **Email trigger configured** with correct email address
- [ ] **Logic node connected** with proper urgent detection
- [ ] **AI nodes configured** with relevant tags/categories  
- [ ] **Actions connected** to correct output services
- [ ] **Workflow saved** with descriptive name
- [ ] **Test emails** processed correctly
- [ ] **Tasks created** in expected tools
- [ ] **Team members** can see new automated tasks

---

## 🚀 What Happens Next?

Once your workflow is live:

1. **Immediate Impact**: All support emails get processed automatically
2. **Urgent Detection**: Critical issues escalate within minutes  
3. **Smart Routing**: Right emails reach right people
4. **Consistent Processing**: No more missed or misclassified emails
5. **Team Efficiency**: Focus on solving problems, not sorting emails

Your customer support just became 10x more efficient! 🎉

---

## 🔧 Customization Tips

**Adjust Logic Conditions**:
- Add multiple logic nodes for complex routing
- Use different operators (starts with, equals, ends with)
- Chain logic nodes for AND/OR conditions

**Fine-tune AI Processing**:  
- Monitor which emails get missed or misclassified
- Add industry-specific keywords
- Create custom tag categories for your business

**Scale Your Actions**:
- Add multiple action types (Slack notifications, email responses)
- Route different categories to different tools
- Set up escalation workflows for aging tickets

The system grows with your needs! 📈
