# Built-in React Flow components

---

## <ReactFlow />

The <ReactFlow /> component is the heart of your React Flow application. It renders your nodes and edges, handles user interaction, and can manage its own state if used as an uncontrolled flow.

```javascript
import { ReactFlow } from '@xyflow/react'

export default function Flow() {
  return <ReactFlow
    nodes={...}
    edges={...}
    onNodesChange={...}
    ...
  />
}
```

## <ReactFlowProvider />

The <ReactFlowProvider /> component is a context provider that makes it possible to access a flow’s internal state outside of the <ReactFlow /> component. Many of the hooks we provide rely on this component to work.

```javascript
import { ReactFlow, ReactFlowProvider, useNodes } from '@xyflow/react'

export default function Flow() {
  return (
    <ReactFlowProvider>
      <ReactFlow nodes={...} edges={...} />
      <Sidebar />
    </ReactFlowProvider>
  )
}

function Sidebar() {
  // This hook will only work if the component it's used in is a child of a
  // <ReactFlowProvider />.
  const nodes = useNodes()

  return (
    <aside>
      {nodes.map((node) => (
        <div key={node.id}>
          Node {node.id} -
            x: {node.position.x.toFixed(2)},
            y: {node.position.y.toFixed(2)}
        </div>
      ))}
    </aside>
  )
}
```

## <Background />

The <Background /> component makes it convenient to render different types of backgrounds common in node-based UIs. It comes with three variants: lines, dots and cross.

```javascript
import { useState } from 'react';
import { ReactFlow, Background, BackgroundVariant } from '@xyflow/react';

export default function Flow() {
  return (
    <ReactFlow defaultNodes={[...]} defaultEdges={[...]}>
      <Background color="#ccc" variant={BackgroundVariant.Dots} />
    </ReactFlow>
  );
}
```

## <BaseEdge />

The <BaseEdge /> component gets used internally for all the edges. It can be used inside a custom edge and handles the invisible helper edge and the edge label for you.

```javascript
import { BaseEdge } from '@xyflow/react'

export function CustomEdge({ sourceX, sourceY, targetX, targetY, ...props }) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const { label, labelStyle, markerStart, markerEnd, interactionWidth } = props

  return (
    <BaseEdge
      path={edgePath}
      label={label}
      labelStyle={labelStyle}
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={interactionWidth}
    />
  )
}
```

## <ControlButton />

You can add buttons to the control panel by using the <ControlButton /> component and pass it as a child to the <Controls /> component.

```javascript
import { MagicWand } from '@radix-ui/react-icons'
import { ReactFlow, Controls, ControlButton } from '@xyflow/react'

export default function Flow() {
  return (
    <ReactFlow nodes={[...]} edges={[...]}>
      <Controls>
        <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
          <MagicWand />
        </ControlButton>
      </Controls>
    </ReactFlow>
  )
}
```

## <Controls />

The <Controls /> component renders a small panel that contains convenient buttons to zoom in, zoom out, fit the view, and lock the viewport.

```javascript
import { ReactFlow, Controls } from '@xyflow/react'

export default function Flow() {
  return (
    <ReactFlow nodes={[...]} edges={[...]}>
      <Controls />
    </ReactFlow>
  )
}
```

## <EdgeLabelRenderer />

Edges are SVG-based. If you want to render more complex labels you can use the <EdgeLabelRenderer /> component to access a div based renderer. This component is a portal that renders the label in a <div /> that is positioned on top of the edges. You can see an example usage of the component in the edge label renderer example.

```javascript
import React from 'react'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'

const CustomEdge = ({ id, data, ...props }) => {
  const [edgePath, labelX, labelY] = getBezierPath(props)

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#ffcc00',
            padding: 10,
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 700,
          }}
          className="nodrag nopan"
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default CustomEdge
```

## <EdgeText />

You can use the <EdgeText /> component as a helper component to display text within your custom edges.

```javascript
import { EdgeText } from '@xyflow/react';
 
export function CustomEdgeLabel({ label }) {
  return (
    <EdgeText
      x={100}
      y={100}
      label={label}
      labelStyle={{ fill: 'white' }}
      labelShowBg
      labelBgStyle={{ fill: 'red' }}
      labelBgPadding={[2, 4]}
      labelBgBorderRadius={2}
    />
  );
}
```

## <Handle />

The <Handle /> component is used in your custom nodes to define connection points.

```javascript
import { Handle, Position } from '@xyflow/react';
 
export const CustomNode = ({ data }) => {
  return (
    <>
      <div style={{ padding: '10px 20px' }}>
        {data.label}
      </div>
 
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
};
```

## <MiniMap />

The <MiniMap /> component can be used to render an overview of your flow. It renders each node as an SVG element and visualizes where the current viewport is in relation to the rest of the flow.

```javascript
import { ReactFlow, MiniMap } from '@xyflow/react';
 
export default function Flow() {
  return (
    <ReactFlow nodes={[...]]} edges={[...]]}>
      <MiniMap nodeStrokeWidth={3} />
    </ReactFlow>
  );
}
```

## <NodeResizeControl />

To create your own resizing UI, you can use the ```NodeResizeControl``` component where you can pass children (such as icons).

## <NodeResizer />

The <NodeResizer /> component can be used to add a resize functionality to your nodes. It renders draggable controls around the node to resize in all directions.

```javascript
import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
 
const ResizableNode = ({ data }) => {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};
 
export default memo(ResizableNode);
```
## <NodeToolbar />

This component can render a toolbar or tooltip to one side of a custom node. This toolbar doesn’t scale with the viewport so that the content is always visible.

```javascript
import { memo } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
 
const CustomNode = ({ data }) => {
  return (
    <>
      <NodeToolbar isVisible={data.toolbarVisible} position={data.toolbarPosition}>
        <button>delete</button>
        <button>copy</button>
        <button>expand</button>
      </NodeToolbar>
 
      <div style={{ padding: '10px 20px' }}>
        {data.label}
      </div>
 
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
};
 
export default memo(CustomNode);
```

## <Panel />

The <Panel /> component helps you position content above the viewport. It is used internally by the <MiniMap /> and <Controls /> components.

```javascript
import { ReactFlow, Panel } from '@xyflow/react';
 
export default function Flow() {
  return (
    <ReactFlow nodes={[...]} fitView>
      <Panel position="top-left">top-left</Panel>
      <Panel position="top-center">top-center</Panel>
      <Panel position="top-right">top-right</Panel>
      <Panel position="bottom-left">bottom-left</Panel>
      <Panel position="bottom-center">bottom-center</Panel>
      <Panel position="bottom-right">bottom-right</Panel>
    </ReactFlow>
  );
}
```

## <ViewportPortal />

<ViewportPortal /> component can be used to add components to the same viewport of the flow where nodes and edges are rendered. This is useful when you want to render your own components that adhere to the same coordinate system as the nodes & edges and are also affected by zooming and panning


```javascript
import React from 'react';
import { ViewportPortal } from '@xyflow/react';
 
export default function () {
  return (
    <ViewportPortal>
      <div
        style={{ transform: 'translate(100px, 100px)', position: 'absolute' }}
      >
        This div is positioned at [100, 100] on the flow.
      </div>
    </ViewportPortal>
  );
}
```