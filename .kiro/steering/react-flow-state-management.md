# Using a State Management Library

In this guide, we explain how to use React Flow with the state management library Zustand. We will build a small app where each node features a color chooser that updates its background color. We chose Zustand for this guide because React Flow already uses it internally, but you can easily use other state management libraries such as Redux , Recoil  or Jotai 

As demonstrated in previous guides and examples, React Flow can easily be used with a local component state to manage nodes and edges in your diagram. However, as your application grows and you need to update the state from within individual nodes, managing this state can become more complex. Instead of passing functions through the node’s data field, you can use a React context  or integrate a state management library like Zustand, as outlined in this guide.

## Install Zustand

As mentioned above we are using Zustand in this example. Zustand is a bit like Redux: you have a central store with actions to alter your state and hooks to access your state. You can install Zustand via:


```javascript
npm install --save zustand

```

## Create a store

Zustand lets you create a hook for accessing the values and functions of your store. We put the ```nodes``` and ```edges``` and the ```onNodesChange```, ```onEdgesChange```, ```onConnect```, ```setNodes``` and ```setEdges``` functions in the store to get the basic interactivity for our graph:

That’s the basic setup. We now have a store with nodes and edges that can handle the changes (dragging, selecting or removing a node or edge) triggered by React Flow. When you take a look at the ```App.tsx``` file, you can see that it’s kept nice and clean. All the data and actions are now part of the store and can be accessed with the ```useStore``` hook.

## Implement a color change action

We add a new ```updateNodeColor``` action to update the ```data.color``` field of a specific node. For this we pass the node id and the new color to the action, iterate over the nodes and update the matching one with the new color:

```javascript
updateNodeColor: (nodeId: string, color: string) => {
  set({
    nodes: get().nodes.map((node) => {
      if (node.id === nodeId) {
        // it's important to create a new object here, to inform React Flow about the changes
        return { ...node, data: { ...node.data, color } };
      }
 
      return node;
    }),
  });
};
```

This new action can now be used in a React component like this:


```javascript
const updateNodeColor = useStore((s) => s.updateNodeColor);
...
<button onClick={() => updateNodeColor(nodeId, color)} />;
```

## Add a color chooser node

In this step we implement the ```ColorChooserNode``` component and call the ```updateNodeColor``` when the user changes the color. The custom part of the color chooser node is the color input.

```javascript
<input
  type="color"
  defaultValue={data.color}
  onChange={(evt) => updateNodeColor(id, evt.target.value)}
  className="nodrag"
/>
```

We add the ```nodrag``` class name so that the user doesn’t drag the node by mistake when changing the color and call the ```updateNodeColor``` in the ```onChange``` event handler.






