# React Flow Documentation 

At its core, React Flow is about creating interactive flowgraphs — a collection of nodes connected by edges. To help you understand the terminology we use throughout the documentation, let’s take a look at the example flow below.

## Core Concepts

1. Terminologies that we will frequently use to describe our app  

---

### Node

React Flow has a few default node types out of the box, but customization is where the magic of React Flow truly happens. You can design your nodes to work exactly the way you need them to—whether that’s embedding interactive form elements, displaying dynamic data visualizations, or even incorporating multiple connection handles. React Flow lays the foundation, and your imagination does the rest.

### Handle

A handle (also known as a “port” in other libraries) is the attachment point where an edge connects to a node. By default, they appear as grey circles on the top, bottom, left, or right sides of a node. But they are just div elements, and can be positioned and styled any way you’d like. When creating a custom node, you can include as many handles as needed. 

### Edges

Edges connect nodes. Every edge needs a target and a source node. React Flow comes with four built-in edge types [https://reactflow.dev/examples/edges/edge-types]: default (bezier), smoothstep, step, and straight. An edge is a SVG path that can be styled with CSS and is completely customizable. If you are using multiple handles, you can reference them individually to create multiple connections for a node.

Like custom nodes, you can also customize edges. Things that people do with custom edges include:

- Adding buttons to remove edges
- Custom routing behavior
- Complex styling or interactions that cannot be solved with just one SVG path

For more information, refer to the Edges page.

### Connection Line

React Flow has built-in functionality that allows you to click and drag from one handle to another to create a new edge. While dragging, the placeholder edge is referred to as a connection line. The connection line comes with the same four built-in types as edges and is customizable. You can find the props for configuring the connection line in the connection props reference [https://reactflow.dev/api-reference/react-flow#connection-line-props]

### Viewport

All of React Flow is contained within the viewport. Each node has an x- and y-coordinate, which indicates its position within the viewport. The viewport has x, y, and zoom values. When you drag the pane, you change the x and y coordinates. When you zoom in or out, you alter the zoom level.

2. Adding nodes

---

Each node represents an element in your diagram with a specific position and content.

### 1. Create node objects

Outside of your React component, create an array of node objects. Each node object needs a unique id and a position. Let’s also add a label to them:

```javascript   
const initialNodes = [
  {
    id: 'n1',
    position: { x: 0, y: 0 },
    data: { label: 'Node 1' },
    type: 'input',
  },
  {
    id: 'n2',
    position: { x: 100, y: 100 },
    data: { label: 'Node 2' },
  },
];
```

### 2. Adding nodes to the flow

Now we can pass our ```initialNodes``` array to the <ReactFlow /> component using the ```nodes``` prop:

```javascript
<ReactFlow nodes={initialNodes}>
  <Background />
  <Controls />
</ReactFlow>
``` 

This will render in two nodes labeled 'Node 1' and 'Node 2' and their position will be at [x: 0, y: 0] and [x: 100, y:100] respectively

3. Adding edges

### Create an edge

To create an edge, we define an array of edge objects. Each edge object needs to have an ```id```, a ```source``` (where the edge begins), and a ```target``` (where it ends). In this example, we use the ```id``` values of the two nodes we created so far (```n1``` and ```n2```) to define the edge:

```javascript
const initialEdges = [
  {
    id: 'n1-n2',
    source: 'n1',
    target: 'n2',
  },
];
```

### Labeling an edge

Let’s give this edge two properties that are built into React Flow, a label and a type: "step".

```javascript
const initialEdges = [
  {
    id: 'n1-n2',
    source: 'n1',
    target: 'n2',
    type: 'step',
    label: 'connects with',
  },
];
```

That's it. That's all you need to know in order to instantiate nodes correctly as well as connecting the edges to form a basic flow with nodes and edges.

3. Adding Interactivity

### Handling change events

By default React Flow doesn’t manage any internal state updates besides handling the viewport. As you would with an HTML <input /> element you need to pass event handlers to React Flow in order to apply triggered changes to your nodes and edges.

### 1. Add imports

To manage changes, we’ll be using ```useState``` with two helper functions from React Flow: applyNodeChanges and applyEdgeChanges. So let’s import these functions:

```javascript
import { useState, useCallback } from 'react';
import { ReactFlow, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
```
### 2. Define nodes and edges

We need to define initial nodes and edges. These will be the starting point for our flow.

```javascript
const initialNodes = [
  {
    id: 'n1',
    position: { x: 0, y: 0 },
    data: { label: 'Node 1' },
    type: 'input',
  },
  {
    id: 'n2',
    position: { x: 100, y: 100 },
    data: { label: 'Node 2' },
  },
];
 
const initialEdges = [
  {
    id: 'n1-n2',
    source: 'n1',
    target: 'n2',
  },
];
```
### 3. Initialize state

In our component, we’ll call the useState hook to manage the state of our nodes and edges:

```javascript
export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
 
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

### 4. Add event handlers

We need to create two event handlers: ````onNodesChange``` and ```onEdgesChange```. They will be used to update the state of our nodes and edges when changes occur, such as dragging or deleting an element. Go ahead and add these handlers to your component:

```javascript
const onNodesChange = useCallback(
  (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
  [],
);
const onEdgesChange = useCallback(
  (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
  [],
);
```

### 5. Pass them to ReactFlow

Now we can pass our nodes, edges, and event handlers to the <ReactFlow /> component:

```javascript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  fitView
>
  <Background />
  <Controls />
</ReactFlow>
```

### 6. Interactive flow

And that’s it! You now have a basic interactive flow 🎉

When you drag or select a node, the ```onNodesChange``` handler is triggered. The ```applyNodeChanges``` function then uses these change events to update the current state of your nodes. Here’s how it all comes together. Try clicking and dragging a node to move it around and watch the UI update in real time.

---

### Handling Connections

---

One last piece is missing: connecting nodes interactively. For this, we need to implement an onConnect handler.

### 1. Create ```onConnect``` handler

The ```onConnect``` handler is called whenever a new connection is made between two nodes. We can use the ```addEdge``` utility function to create a new edge and update the edge Array.

```javascript
const onConnect = useCallback(
  (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
  [],
);
```

### 2. Pass it to ReactFlow

Now we can pass the ```onConnect``` handler to the <ReactFlow /> component:

```javascript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  fitView
>
  <Background />
  <Controls />
</ReactFlow>
```

### 3. Connectable flow

Try to connect the two nodes by dragging from on handle to another one. The onConnect handler will be triggered, and the new edge will be added to the flow. 🥳

Whenever React Flow triggers a change (node init, node drag, edge select, etc.), the ```onNodesChange``` handler gets called. We export an ```applyNodeChanges``` handler so that you don’t need to handle the changes by yourself. The applyNodeChanges handler returns an updated array of nodes that is your new nodes array. You now have an interactive flow with the following capabilities:

- selectable nodes and edges
- draggable nodes
- connectable nodes by dragging from one node handle to another
- multi-selection area by pressing shift — the default selectionKeyCode
- multi-selection by pressing cmd — the default multiSelectionKeyCode
- removing selected elements by pressing backspace — the default deleteKeyCode

---

### Built-In Components

---

React Flow comes with several built-in components that can be passed as children to the <ReactFlow /> component.

### MiniMap

The ```MiniMap``` provides a bird’s-eye view of your flowgraph, making navigation easier, especially for larger flows. You can customize the appearance of nodes in the minimap by providing a nodeColor function.

### Controls

React Flow comes with a set of customizable ```Controls``` for the viewport. You can zoom in and out, fit the viewport and toggle if the user can move, select and edit the nodes.

### Background

The ```Background``` component adds a visual grid pattern to your flowgraph, helping users maintain orientation. You can choose from different pattern variants, or if you need more advanced customization, you can explore the source  code to implement your own pattern.

### Panel

The ```Panel``` component allows you to add fixed overlays to your flowgraph, perfect for titles, controls, or any other UI elements that should remain stationary.


