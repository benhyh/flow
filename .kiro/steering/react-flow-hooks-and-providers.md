# Hooks and Providers

--

## ReactFlowProvider

The ReactFlowProvider is a context provider that allows you to access the internal state of the flow, such as nodes, edges, and viewport, from anywhere in your component tree even outside the ```ReactFlow``` component. It is typically used at the top level of your application.

There are several cases where you might need to use the ```ReactFlowProvider``` component:
- Many of the hooks we provide rely on this component to work.## ReactFlow``` component.
- You are working with multiple flows on a page.
- You are using a client-side router

App.jsx
```typescript
import React, { useCallback } from 'react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
} from '@xyflow/react';

import Sidebar from './Sidebar';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  {
    id: 'provider-1',
    type: 'input',
    data: { label: 'Node 1' },
    position: { x: 250, y: 5 },
  },
  { id: 'provider-2', data: { label: 'Node 2' }, position: { x: 100, y: 100 } },
  { id: 'provider-3', data: { label: 'Node 3' }, position: { x: 400, y: 100 } },
  { id: 'provider-4', data: { label: 'Node 4' }, position: { x: 400, y: 200 } },
];

const initialEdges = [
  {
    id: 'provider-e1-2',
    source: 'provider-1',
    target: 'provider-2',
    animated: true,
  },
  { id: 'provider-e1-3', source: 'provider-1', target: 'provider-3' },
];

const ProviderFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [],
  );

  return (
    <div className="providerflow">
      <ReactFlowProvider>
        <div className="reactflow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
        <Sidebar nodes={nodes} setNodes={setNodes} />
      </ReactFlowProvider>
    </div>
  );
};

export default ProviderFlow;
```

Sidebar.jsx
```typescript
import React, { useCallback } from 'react';
import { useStore } from '@xyflow/react';

const transformSelector = (state) => state.transform;

export default ({ nodes, setNodes }) => {
  const transform = useStore(transformSelector);

  const selectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        return {
          ...node,
          selected: true,
        };
      }),
    );
  }, [setNodes]);

  return (
    <aside>
      <div className="description">
        This is an example of how you can access the internal state outside of the
        ReactFlow component.
      </div>
      <div className="title">Zoom & pan transform</div>
      <div className="transform">
        [{transform[0].toFixed(2)}, {transform[1].toFixed(2)}, {transform[2].toFixed(2)}]
      </div>
      <div className="title">Nodes</div>
      {nodes.map((node) => (
        <div key={node.id}>
          Node {node.id} - x: {node.position.x.toFixed(2)}, y:{' '}
          {node.position.y.toFixed(2)}
        </div>
      ))}

      <div className="selectall">
        <button className="xy-theme__button" onClick={selectAll}>
          select all nodes
        </button>
      </div>
    </aside>
  );
};
```

## useReactFlow

The ```useReactFlow``` hook provides access to the ```ReactFlowInstance``` and its methods. It allows you to manipulate nodes, edges, and the viewport programmatically.

App.jsx
```javascript
import React, { useCallback } from 'react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';

import Buttons from './Buttons';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Node 1' },
    position: { x: 250, y: 5 },
  },
  { id: '2', data: { label: 'Node 2' }, position: { x: 100, y: 100 } },
  { id: '3', data: { label: 'Node 3' }, position: { x: 400, y: 100 } },
  { id: '4', data: { label: 'Node 4' }, position: { x: 400, y: 200 } },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
  { id: 'e1-3', source: '1', target: '3' },
];

const ProviderFlow = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [],
  );

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Buttons />
        <Background />
      </ReactFlow>
    </ReactFlowProvider>
  );
};

export default ProviderFlow;

```

Buttons.jsx
```javascript
import React from 'react';
import { useStoreApi, useReactFlow, Panel } from '@xyflow/react';

const panelStyle = {
  color: '#777',
  fontSize: 12,
};

const buttonStyle = {
  fontSize: 12,
  marginRight: 5,
  marginTop: 5,
};

export default () => {
  const store = useStoreApi();
  const { zoomIn, zoomOut, setCenter } = useReactFlow();

  const focusNode = () => {
    const { nodeLookup } = store.getState();
    const nodes = Array.from(nodeLookup).map(([, node]) => node);

    if (nodes.length > 0) {
      const node = nodes[0];

      const x = node.position.x + node.measured.width / 2;
      const y = node.position.y + node.measured.height / 2;
      const zoom = 1.85;

      setCenter(x, y, { zoom, duration: 1000 });
    }
  };

  return (
    <Panel position="top-left" style={panelStyle}>
      <div className="description">
        This is an example of how you can use the zoom pan helper hook
      </div>
      <div>
        <button className="xy-theme__button" onClick={focusNode} style={buttonStyle}>
          focus node
        </button>
        <button className="xy-theme__button" onClick={zoomIn} style={buttonStyle}>
          zoom in
        </button>
        <button className="xy-theme__button" onClick={zoomOut} style={buttonStyle}>
          zoom out
        </button>
      </div>
    </Panel>
  );
};
```