# Server side rendering, server side generation

In this guide you will learn how to configure React Flow to render a flow on the server, which will allow you to
- Display static HTML diagrams in documentation
- Render React Flow diagrams in non-js environments
- Dynamically generate open graph images that appear as embeds when sharing a link to your flow

## Node Dimensions

You need to configure a few things to make React Flow work on the server, the most important being the node dimensions. React Flow only renders nodes if they have a width and height. Usually you pass nodes without a specific width and height, they are then measured and the dimensions get written to measured.width and measured.height. Since we can’t measure the dimensions on the server, we need to pass them explicitly. This can be done with the width and height or the initialWidth and initialHeight node properties.

```javascript
const nodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 0, y: 0 },
    data: { label: 'Node 1' },
    width: 100,
    height: 50,
  },
];
```

React Flow now knows the dimensions of the node and can render it on the server. The ```width``` and ```height``` properties are used as an inline style for the node. If you expect nodes to have different dimensions on the client or if the dimensions should by dynamic based on the content, you can use the ```initialWidth``` and ```initialHeight``` properties. They are only used for the first render (on the server or on the client) as long as the nodes are not measured and ```measured.width``` and ```measured.height``` are not set.

There are two ways to specify node dimensions for server side rendering:

1. ```width``` and ```height``` for static dimensions that are known in advance and don’t change.
2. ```initialWidth``` and ```initialHeight``` for dynamic dimensions that are not known in advance or change.

## Handle positions

You probably also want to render the edges on the server. On the client, React Flow checks the positions of the handles and stores that information to draw the edges. Since we can’t measure the handle positions on the server, we need to pass this information, too. This can be done with the ```handles``` property of a node.

```javascript
const nodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 0, y: 0 },
    data: { label: 'Node 1' },
    width: 100,
    height: 50,
    handles: [
      {
        type: 'target',
        position: Position.Top,
        x: 100 / 2,
        y: 0,
      },
      {
        type: 'source',
        position: Position.Bottom,
        x: 100 / 2,
        y: 50,
      },
    ],
  },
];
```

With this additional information, React Flow knows enough about the handles to render the edges on the server. If you are fine with just rendering the nodes, you can skip this step.

## Using ```fitView``` on the server

If you know the dimensions of the React Flow container itself, you can even use ```fitView``` on the server. For this, you need to pass the ```width``` and ```height``` of the container to the ```ReactFlow``` component.

```javascript
<ReactFlow nodes={nodes} edges={edges} fitView width={1000} height={500} />
```

## Usage with the <ReactFlowProvider>

If you are using the ```ReactFlowProvider```, you can pass ```initialNodes```, ```initialEdges``` and optional wrapper dimensions (```initialWidth``` and ```initialHeight```) and ```fitView``` to the provider.

```javascript
<ReactFlowProvider
  initialNodes={nodes}
  initialEdges={edges}
  initialWidth={1000}
  initialHeight={500}
  fitView
>
  <App />
</ReactFlowProvider>
```
The ```initial-``` prefix means that these values are only used for the first render. After that, the provider will use the ```nodes``` and ```edges``` from the context.

## Creating static HTML

If you want to create static HTML, you can use the ```renderToStaticMarkup``` function from React. This will render the React Flow component to a string of HTML. You can then use this string to create a static HTML file or send it as a response to an HTTP request.

```javascript
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactFlow, Background } from '@xyflow/react';
 
function toHTML({ nodes, edges, width, height }) {
  const html = renderToStaticMarkup(
    React.createElement(
      ReactFlow,
      {
        nodes,
        edges,
        width,
        height,
        minZoom: 0.2,
        fitView: true,
      },
      React.createElement(Background, null),
    ),
  );
 
  return html;
}
```









