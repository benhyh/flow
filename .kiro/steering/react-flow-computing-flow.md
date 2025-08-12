# Computing Flows

Usually with React Flow, developers handle their data outside of React Flow by sending it somewhere else, like on a server or a database. Instead, in this guide we’ll show you how to compute data flows directly inside of React Flow. You can use this for updating a node based on connected data, or for building an app that runs entirely inside the browser.

## Creating custom nodes

Let’s start by creating a custom input node (NumberInput.js) and add three instances of it. We will be using a controlled <input type="number" /> and limit it to integer numbers between 0 - 255 inside the onChange event handler.

```javascript
import { useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
 
function NumberInput({ id, data }) {
  const [number, setNumber] = useState(0);
 
  const onChange = useCallback((evt) => {
    const cappedNumber = Math.round(
      Math.min(255, Math.max(0, evt.target.value)),
    );
    setNumber(cappedNumber);
  }, []);
 
  return (
    <div className="number-input">
      <div>{data.label}</div>
      <input
        id={`number-${id}`}
        name="number"
        type="number"
        min="0"
        max="255"
        onChange={onChange}
        className="nodrag"
        value={number}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
 
export default NumberInput;
```

Next, we’ll add a new custom node (ColorPreview.js) with one target handle for each color channel and a background that displays the resulting color. We can use mix-blend-mode: 'difference'; to make the text color always readable.

Whenever you have multiple handles of the same kind on a single node, don’t forget to give each one a separate id!

Let’s also add edges going from the input nodes to the color node to our ```initialEdges``` array while we are at it.

## Computing data

How do we get the data from the input nodes to the color node? This is a two step process that involves two hooks created for this exact purpose:

1. Store each number input value inside the node’s ```data``` object with help of the ```updateNodeData``` callback.

2. Find out which nodes are connected by using ```useNodeConnections```and then use ```useNodesData``` for receiving the data from the connected nodes.

### Step 1: Writing values to the data object

First let’s add some initial values for the input nodes inside the ```data``` object in our ```initialNodes``` array and use them as an initial state for the input nodes. Then we’ll grab the function ```updateNodeData``` from the ```useReactFlow``` hook and use it to update the ```data``` object of the node with a new value whenever the input changes.

By default, the data you pass to updateNodeData will be merged with the old data object. This makes it easier to do partial updates and saves you in case you forget to add {...data}. You can pass { replace: true } as an option to replace the object instead.

### Step 2: Getting data from connected nodes

We start by determining all connections for each node with the ```useNodeConnections``` hook and then fetching the data for the first connected node with ```updateNodeData```.

Note that each handle can have multiple nodes connected to it and you might want to restrict the number of connections to a single handle inside your application. Check out the connection limit example to see how to do that.

## Getting more complex

Now we have a simple example of how to pipe data through React Flow. What if we want to do something more complex, like transforming the data along the way? Or even take different paths? We can do that too!

### Continuing the flow

Let’s extend our flow. Start by adding an output <Handle type="source" position={Position.Right} /> to the color node and remove the local component state.

Because there are no inputs fields on this node, we don’t need to keep a local state at all. We can just read and update the node’s data object directly.

Next, we add a new node (```Lightness.js```) that takes in a color object and determines if it is either a light or dark color. We can use the relative luminance formula  ```luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b``` to calculate the perceived brightness of a color (0 being the darkest and 255 being the brightest). We can assume everything >= 128 is a light color.

### Conditional branching

What if we would like to take a different path in our flow based on the perceived lightness? Let’s give our lightness node two source handles ```light``` and ```dark``` and separate the node ```data``` object by source handle IDs. This is needed if you have multiple source handles to distinguish between each source handle’s data.

But what does it mean to “take a different route”? One solution would be to assume that ```null``` or ```undefined``` data hooked up to a target handle is considered a “stop”. In our case we can write the incoming color into ```data.values.light``` if it’s a light color and into ```data.values.dark``` if it’s a dark color and set the respective other value to null.

Don’t forget to add ```flex-direction: column;``` and ```align-items: end;``` to reposition the handle labels.

## Summary

You have learned how to move data through the flow and transform it along the way. All you need to do is:

1. store data inside the node’s ```data``` object with help of ```updateNodeData``` callback.
2. find out which nodes are connected by using ```useNodeConnections``` and then use ```useNodesData``` for receiving the data from the connected nodes.

You can implement branching for example by interpreting incoming data that is undefined as a “stop”. As a side note, most flow graphs that also have a branching usually separate the triggering of nodes from the actual data hooked up to the nodes. Unreal Engines Blueprints are a good example for this.

One last note before you go: you should find a consistent way of structuring all your node data, instead of mixing ideas like we did just now. This means for example, if you start working with splitting data by handle ID you should do it for all nodes, regardless whether they have multiple handles or not. Being able to make assumptions about the structure of your data throughout your flow will make life a lot easier.
