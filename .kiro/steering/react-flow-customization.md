# Customization with React Flow Nodes

## Custom Nodes

A powerful feature of React Flow is the ability to create custom nodes. This gives you the flexibility to render anything you want within your nodes. We generally recommend creating your own custom nodes rather than relying on built-in ones. With custom nodes, you can add as many source and target handles [https://reactflow.dev/learn/customization/handles] as you like—or even embed form inputs, charts, and other interactive elements.

In this section, we’ll walk through creating a custom node during an input field that updates text elsewhere in your application. For further examples, we recommend checking out our Custom Node Example [https://reactflow.dev/examples/nodes/custom-node]

### Implementing a custom node
---

To create a custom node, all you need to do is create a React component. React Flow will automatically wrap it in an interactive container that injects essential props like the node’s id, position, and data, and provides functionality for selection, dragging, and connecting handles. For a full overview on all available node props, see the Node reference.

#### 1. Create a component

Let’s dive into an example by creating a custom node called TextUpdaterNode. For this, we’ve added a simple input field with a change handler.

```javascript
export function TextUpdaterNode(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className="text-updater-node">
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
    </div>
  );
}
```

#### 2. Initialize nodeTypes

You can add a new node type to React Flow by adding it to the ```nodeTypes``` prop like below. We define the ```nodeTypes``` outside of the component to prevent re-renderings.

```javascript
const nodeTypes = {
  textUpdater: TextUpdaterNode,
};
```

#### 3. Pass nodeTypes to React Flow

```javascript
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  fitView
/>
```

#### 4. Update node definitions

After defining your new node type, you can use it by specifying the ```type``` property on your node definition:

```javascript
const nodes = [
  {
    id: 'node-1',
    type: 'textUpdater',
    position: { x: 0, y: 0 },
    data: { value: 123 },
  },
];
```

#### 5. Flow with custom node

After putting all together and adding some basic styles we get a custom node that prints text to the console:

---

## Handles

Handles are the connection points on nodes in React Flow. Our built-in nodes include one source and one target handle, but you can customize your nodes with as many different handles as you need.

### Creating a node with handles

To create a custom node with handles, you can use the <Handle /> component provided by React Flow. This component allows you to define source and target handles for your custom nodes. Here’s an example of how to implement a custom node with two handles:

```javascript
import { Handle } from '@xyflow/react';
 
export function CustomNode() {
  return (
    <div className="custom-node">
      <div>Custom Node Content</div>
      <Handle type="source" position="top" />
      <Handle type="target" position="bottom" />
    </div>
  );
}
```

### Using multiple handles

If you want to use multiple source or target handles in your custom node, you need to specify each handle with a unique id. This allows React Flow to differentiate between the handles when connecting edges.

```javascript
  <Handle type="target" position="top" />
  <Handle type="source" position="right" id="a" />
  <Handle type="source" position="bottom" id="b" />
```

To connect an edge to a specific handle of a node, use the properties sourceHandle (for the edge’s starting point) and ```targetHandle``` (for the edge’s ending point). By defining ```sourceHandle``` or ```targetHandle``` with the appropriate handle ```id```, you instruct React Flow to attach the edge to that specific handle, ensuring that connections are made where you intend.

```javascript
const initialEdges = [
  { id: 'n1-n2', source: 'n1', sourceHandle: 'a', target: 'n2' },
  { id: 'n1-n3', source: 'n1', sourceHandle: 'b', target: 'n3' },
];
```

In this case, the source node is n1 for both handles but the handle ```ids``` are different. One comes from handle id ```a``` and the other one from ```b```. Both edges also have different target nodes:

### Custom handles

You can create your own custom handles by wrapping the <Handle /> component. This example shows a custom handle that only allows connections when the connection source matches a given id.

```javascript
import { Handle, Position } from '@xyflow/react';
 
export function TargetHandleWithValidation({ position, source }) {
  return (
    <Handle
      type="target"
      position={position}
      isValidConnection={(connection) => connection.source === source}
      onConnect={(params) => console.log('handle onConnect', params)}
      style={{ background: '#fff' }}
    />
  );
}
```

### Typeless handles

If you want to create a handle that does not have a specific type (source or target), you can set ```connectionMode``` [https://reactflow.dev/api-reference/react-flow#connectionmode] to ```Loose``` in the <ReactFlow /> component. This allows the handle to be used for both incoming and outgoing connections.

### Dynamic handles

If you are programmatically changing the position or number of handles in your custom node, you need to update the node internals with the ```useUpdateNodeInternals``` [https://reactflow.dev/api-reference/hooks/use-update-node-internals] hook.

#### Styling handles when connecting

The handle receives the additional class names ```connecting``` when the connection line is above the handle and ```valid``` if the connection is valid. You can find an example which uses these classes here [https://reactflow.dev/examples/interaction/validation]

#### Hiding handles

If you need to hide a handle for some reason, you must use ```visibility: hidden``` or ```opacity: 0``` instead of ```display: none```. This is important because React Flow needs to calculate the dimensions of the handle to work properly and using ```display: none``` will report a width and height of 0!

---

## Custom Edges

---

Like custom nodes, parts of a custom edge in React Flow are just React components. That means you can render anything you want along an edge! This guide shows you how to implement a custom edge with some additional controls. For a comprehensive reference of props available for custom edges, see the Edge reference.

### A basic custom edge

An edge isn’t much use to us if it doesn’t render a path between two connected nodes. These paths are always SVG-based and are typically rendered using the <BaseEdge /> component. To calculate the actual SVG path to render, React Flow comes with some handy utility functions:

- ```getBezierPath``` [https://reactflow.dev/api-reference/utils/get-bezier-path]
- ```getSimpleBezierPath``` [https://reactflow.dev/api-reference/utils/get-simple-bezier-path]
- ```getSmoothStepPath``` [https://reactflow.dev/api-reference/utils/get-smooth-step-path]
- ```getStraightPath``` [https://reactflow.dev/api-reference/utils/get-straight-path]

To kickstart our custom edge, we’ll just render a straight path between the source and target.

#### 1. Create the component

We start by creating a new React component called ```CustomEdge```. Then we render the <BaseEdge /> component with the calculated path. This gives us a straight edge that behaves the same as the built-in default edge version ```"straight"```.

```javascript
import { BaseEdge, getStraightPath } from '@xyflow/react';
 
export function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
 
  return (
    <>
      <BaseEdge id={id} path={edgePath} />
    </>
  );
}
```

#### 2. Create ```edgeTypes```

Outside of our component, we define an ```edgeTypes``` object. We name our new edge type ```"custom-edge"``` and assign the ```CustomEdge``` component we just created to it.

```javascript
const edgeTypes = {
  'custom-edge': CustomEdge,
};
```

#### 3. Pass the edgeTypes prop

To use it, we also need to update the ```edgeTypes``` prop on the <ReactFlow /> component.

```javascript
export function Flow() {
  return <ReactFlow edgeTypes={edgeTypes} />;
}
```

#### 4. Use the new edge type

After defining the ```edgeTypes``` object, we can use our new custom edge by setting the ```type``` field of an edge to ```custom-edge"```.

```javascript
const initialEdges = [
  {
    id: 'e1',
    source: 'n1',
    target: 'n2',
    type: 'custom-edge',
  },
];
```

### Custom SVG edge paths

As discussed previously, if you want to make a custom edge in React Flow, you have to use either of the four path creation functions discussed above (e.g ```getBezierPath```). However if you want to make some other path shape like a Sinusoidal edge or some other edge type then you will have to make the edge path yourself.

The edge path we get from functions like ```getBezierPath``` is just a path string which we pass into the path prop of the <BaseEdge /> component. It contains the necessary information needed in order to draw that path, like where it should start from, where it should curve, where it should end, etc. A simple straight path string between two points ```(x1, y1)``` to ```(x2, y2)``` would look like:

```javascript
M x1 y1 L x2 y2
```

An SVG path is a concatenated list of commands like ```M, L, Q,``` etc, along with their values. Some of these commands are listed below, along with their supported values.

- ```M x1 y1``` is the Move To command which moves the current point to the x1, y1 coordinate.
- ```L x1 y1``` is the Line To command which draws a line from the current point to x1, y1 coordinate.
- ```Q x1 y1 x2 y2``` is the Quadratic Bezier Curve command which draws a bezier curve from the current point to the x2, y2 coordinate. x1, y1 is the control point of the curve which determines the curviness of the curve.
`
Whenever we want to start a path for our custom edge, we use the M command to move our current point to ```sourceX, sourceY``` which we get as props in the custom edge component. Then based on the shape we want, we will use other commands like ```L```(to make lines),```Q```(to make curves) and then finally end our path at ```targetX, targetY``` which we get as props in the custom edge component.

---

## Edge Labels

---

One of the more common uses for custom edges is rendering some controls or info along an edge’s path. In React Flow we call that an custom edge label and unlike the edge path, edge labels can be any React component!

### Adding an edge label

To render a custom edge label we must wrap it in the <EdgeLabelRenderer /> component. This allows us to render the labels outside of the SVG world where the edges life. The edge label renderer is a portal to a single container that all edge labels are rendered into.


Let’s add a button to our custom edge that can be used to delete the edge it’s attached to:

```javascript
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';
 
export default function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const { deleteElements } = useReactFlow();
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
 
  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button onClick={() => deleteElements({ edges: [{ id }] })}>delete</button>
      </EdgeLabelRenderer>
    </>
  );
}
```

If we try to use this edge now, we’ll see that the button is rendered in the centre of the flow (it might be hidden behind “Node A”). Because of the edge label portal, we’ll need to do some extra work to position the button ourselves.

Fortunately, the path utils we’ve already seen can help us with this! Along with the SVG path to render, these functions also return the ```x and y``` coordinates of the path’s midpoint. We can then use these coordinates to translate our custom edge label’s into the right position!

```javascript
export default function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getStraightPath({ ... });
 
  return (
    ...
        <button
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onClick={() => deleteElements({ edges: [{ id }] })}
        >
    ...
  );
}
```

***NOTE:

To make sure our edge labels are interactive and not just for presentation, it is important to add ```pointer-events: all``` to the label’s style. This will ensure that the label is clickable.

And just like with interactive controls in custom nodes, we need to remember to add the ```nodrag``` and ```nopan``` classes to the label to stop mouse events from controlling the canvas.

---

## Utility Classes

---

React Flow provides several built-in utility CSS classes to help you fine-tune how interactions work within your custom elements.

### ```nodrag```

Adding the class ```nodrag``` to an element ensures that interacting with it doesn’t trigger a drag. This is particularly useful for elements like buttons or inputs that should not initiate a drag operation when clicked.

Nodes have a ```drag``` class name in place by default. However, this class name can affect the behaviour of the event listeners inside your custom nodes. To prevent unexpected behaviours, add a ```nodrag``` class name to elements with an event listener. This prevents the default drag behavior as well as the default node selection behavior when elements with this class are clicked.

```javascript
export default function CustomNode(props: NodeProps) {
  return (
    <div>
      <input className="nodrag" type="range" min={0} max={100} />
    </div>
  );
}
```

### ```nopan```
If an element in the canvas does not stop mouse events from propagating, clicking and dragging that element will pan the viewport. Adding the “nopan” class prevents this behavior and this prop allows you to change the name of that class.

```javascript
export default function CustomNode(props: NodeProps) {
  return (
    <div className="nopan">
      <p>fixed content...</p>
    </div>
  );
}
```

### ```nowheel```
If your custom element contains scrollable content, you can apply the ```nowheel``` class. This disables the canvas’ default pan behavior when you scroll inside your custom node, ensuring that only the content scrolls instead of moving the entire canvas.

```javascript
export default function CustomNode(props: NodeProps) {
  return (
    <div className="nowheel" style={{ overflow: 'auto' }}>
      <p>Scrollable content...</p>
    </div>
  );
}
```

Applying these utility classes helps you control interaction on a granular level. You can customize these class names inside React Flow’s style props [https://reactflow.dev/api-reference/react-flow#style-props].

***NOTE:

When creating your own custom nodes, you will also need to remember to style them! Unlike the built-in nodes, custom nodes have no default styles, so feel free to use any styling method you prefer, such as Tailwind CSS.

---

## Theming

---

React Flow has been built with deep customization in mind. Many of our users fully transform the look and feel of React Flow to match their own brand or design system. This guide will introduce you to the different ways you can customize React Flow’s appearance.

### Default styles

React Flow’s default styles are enough to get going with the built-in nodes. They provide some sensible defaults for styles like padding, border radius, and animated edges. You can see what they look like below:

```javascript
import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';


const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const initialNodes = [
  {
    id: '1',
    position: { x: 0, y: 150 },
    data: { label: 'default style 1' },
    ...nodeDefaults,
  },
  {
    id: '2',
    position: { x: 250, y: 0 },
    data: { label: 'default style 2' },
    ...nodeDefaults,
  },
  {
    id: '3',
    position: { x: 250, y: 150 },
    data: { label: 'default style 3' },
    ...nodeDefaults,
  },
  {
    id: '4',
    position: { x: 250, y: 300 },
    data: { label: 'default style 4' },
    ...nodeDefaults,
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
  },
  {
    id: 'e1-4',
    source: '1',
    target: '4',
  },
];

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [],
  );

  return (
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
      <MiniMap />
    </ReactFlow>
  );
};

export default Flow;

```

You’ll typically load these default styles by importing them in you ```App.jsx`` `file or other entry point:

```javascript
import '@xyflow/react/dist/style.css';
```

Without dipping into custom nodes [https://reactflow.dev/examples/nodes/custom-node] and edges [https://reactflow.dev/examples/edges/custom-edges], there are three ways you can style React Flow’s basic look:

- Passing inline styles through ```style``` props
- Overriding the built-in classes with custom CSS
- Overriding the CSS variables React Flow uses

### Built in dark and light mode

You can choose one of the built-in color modes by using the ```colorMode``` prop (‘dark’, ‘light’ or ‘system’) as seen in the dark mode example.

```javascript
import ReactFlow from '@xyflow/react';
 
export default function Flow() {
  return <ReactFlow colorMode="dark" nodes={[...]} edges={[...]} />
}
```

When you use the ```colorMode``` prop, React Flow adds a class to the root element (```.react-flow```) that you can use to style your flow based on the color mode:

```javascript
.dark .react-flow__node {
  background: #777;
  color: white;
}
 
.light .react-flow__node {
  background: white;
  color: #111;
}
```

### Customizing with ```style``` props

The easiest way to start customizing the look and feel of your flows is to use the style prop found on many of React Flow’s components to inline your own CSS.

```javascript
import ReactFlow from '@xyflow/react'
 
const styles = {
  background: 'red',
  width: '100%',
  height: 300,
};
 
export default function Flow() {
  return <ReactFlow style={styles} nodes={[...]} edges={[...]} />
}
```

### CSS variables

If you don’t want to replace the default styles entirely but just want to tweak the overall look and feel, you can override some of the CSS variables we use throughout the library. For an example of how to use these CSS variables, check out our Feature Overview [https://reactflow.dev/examples/overview] example.

These variables are mostly self-explanatory. Below is a table of all the variables you might want to tweak and their default values for reference:

Variable name	Default
--xy-edge-stroke-default	#b1b1b7
--xy-edge-stroke-width-default	1
--xy-edge-stroke-selected-default	#555
--xy-connectionline-stroke-default	#b1b1b7
--xy-connectionline-stroke-width-default	1
--xy-attribution-background-color-default	rgba(255, 255, 255, 0.5)
--xy-minimap-background-color-default	#fff
--xy-background-pattern-dots-color-default	#91919a
--xy-background-pattern-line-color-default	#eee
--xy-background-pattern-cross-color-default	#e2e2e2
--xy-node-color-default	inherit
--xy-node-border-default	1px solid #1a192b
--xy-node-background-color-default	#fff
--xy-node-group-background-color-default	rgba(240, 240, 240, 0.25)
--xy-node-boxshadow-hover-default	0 1px 4px 1px rgba(0, 0, 0, 0.08)
--xy-node-boxshadow-selected-default	0 0 0 0.5px #1a192b
--xy-handle-background-color-default	#1a192b
--xy-handle-border-color-default	#fff
--xy-selection-background-color-default	rgba(0, 89, 220, 0.08)
--xy-selection-border-default	1px dotted rgba(0, 89, 220, 0.8)
--xy-controls-button-background-color-default	#fefefe
--xy-controls-button-background-color-hover-default	#f4f4f4
--xy-controls-button-color-default	inherit
--xy-controls-button-color-hover-default	inherit
--xy-controls-button-border-color-default	#eee
--xy-controls-box-shadow-default	0 0 2px 1px rgba(0, 0, 0, 0.08)
--xy-resize-background-color-default	#3367d9

These variables are used to define the defaults for the various elements o

```javascript
.react-flow {
  --xy-node-background-color-default: #ff5050;
}
```

Be aware that these variables are defined under ```.react-flow``` and under ```:root```.

### Overriding built-in classes

Some consider heavy use of inline styles to be an anti-pattern. In that case, you can override the built-in classes that React Flow uses with your own CSS. There are many classes attached to all sorts of elements in React Flow, but the ones you’ll likely want to override are listed below:

Class name	Description
.react-flow	The outermost container
.react-flow__renderer	The inner container
.react-flow__zoompane	Zoom & pan pane
.react-flow__selectionpane	Selection pane
.react-flow__selection	User selection
.react-flow__edges	The element containing all edges in the flow
.react-flow__edge	Applied to each Edge in the flow
.react-flow__edge.selected	Added to an Edge when selected
.react-flow__edge.animated	Added to an Edge when its animated prop is true
.react-flow__edge.updating	Added to an Edge while it gets updated via onReconnect
.react-flow__edge-path	The SVG <path /> element of an Edge
.react-flow__edge-text	The SVG <text /> element of an Edge label
.react-flow__edge-textbg	The SVG <text /> element behind an Edge label
.react-flow__connection	Applied to the current connection line
.react-flow__connection-path	The SVG <path /> of a connection line
.react-flow__nodes	The element containing all nodes in the flow
.react-flow__node	Applied to each Node in the flow
.react-flow__node.selected	Added to a Node when selected.
.react-flow__node-default	Added when Node type is "default"
.react-flow__node-input	Added when Node type is "input"
.react-flow__node-output	Added when Node type is "output"
.react-flow__nodesselection	Nodes selection
.react-flow__nodesselection-rect	Nodes selection rect
.react-flow__handle	Applied to each <Handle /> component
.react-flow__handle-top	Applied when a handle’s Position is set to "top"
.react-flow__handle-right	Applied when a handle’s Position is set to "right"
.react-flow__handle-bottom	Applied when a handle’s Position is set to "bottom"
.react-flow__handle-left	Applied when a handle’s Position is set to "left"
.connectingfrom	Added to a Handle when a connection line is above a handle.
.connectingto	Added to a Handle when a connection line is above a handle.
.valid	Added to a Handle when a connection line is above and the connection is valid
.react-flow__background	Applied to the <Background /> component
.react-flow__minimap	Applied to the <MiniMap /> component
.react-flow__controls	Applied to the <Controls /> component

### Third-party solutions
You can choose to opt-out of React Flow’s default styling altogether and use a third-party styling solution instead. If you want to do this, you must make sure you still import the base styles.


```javascript
import '@xyflow/react/dist/base.css';
```

These base styles are required for React Flow to function correctly. If you don’t import them or you override them with your own styles, some things might not work as expected!

### TailwindCSS

Custom nodes and edges are just React components, and you can use any styling solution you’d like to style them. For example, you might want to use Tailwind  to style your nodes:

```javascript
function CustomNode({ data }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-gray-100">
          {data.emoji}
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.name}</div>
          <div className="text-gray-500">{data.job}</div>
        </div>
      </div>
 
      <Handle
        type="target"
        position={Position.Top}
        className="w-16 !bg-teal-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-16 !bg-teal-500"
      />
    </div>
  );
}
```

If you want to overwrite default styles, make sure to import Tailwinds entry point after React Flows base styles.

```
import '@xyflow/react/dist/style.css';
import 'tailwind.css';
```

For a complete example of using Tailwind with React Flow, check out the example [https://reactflow.dev/examples/styling/tailwind]!


