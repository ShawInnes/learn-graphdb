import {FC, useCallback, useEffect, useState} from 'react';
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer, useCamera,
  useLoadGraph,
  useSigma,
  ZoomControl,
} from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';
import Graph from 'graphology';
import {
  useLayoutForceAtlas2,
} from '@react-sigma/layout-forceatlas2';
import {GraphSearch, GraphSearchOption} from '@react-sigma/graph-search';

const sigmaStyle = {height: '100vh', width: '100vw'};

export const FocusOnNode: FC<{node: string | null; move?: boolean}> = ({node, move}) => {
  // Get sigma
  const sigma = useSigma();
  // Get camera hook
  const {gotoNode} = useCamera();

  /**
   * When the selected item changes, highlighted the node and center the camera on it.
   */
  useEffect(() => {
    if (!node) return;
    sigma.getGraph().setNodeAttribute(node, 'highlighted', true);
    if (move) gotoNode(node);

    return () => {
      sigma.getGraph().setNodeAttribute(node, 'highlighted', false);
    };
  }, [node, move, sigma, gotoNode]);

  return null;
};

const LoadGraphFromJSON = ({jsonFilePath}: {jsonFilePath: string}) => {
  const loadGraph = useLoadGraph();
  const {assign} = useLayoutForceAtlas2({
    iterations: 100,
    settings: {
      gravity: 0.01,
      scalingRatio: 1,
      strongGravityMode: true,
      slowDown: 2,
    },
  });

  const getNodeSize = (n) => {
    if (n.attributes.label && n.attributes.label.includes('Chief'))
      return 20;

    if (n.attributes.label && n.attributes.label.includes('Manager'))
      return 15;

    return 5;
  };

  const getNodeColor = (n) => {
    if (n.attributes.label && n.attributes.label.includes('Chief'))
      return '#ff0000';

    if (n.attributes.label && n.attributes.label.includes('Manager'))
      return '#66ff00';

    return '#7e7885';
  };

  useEffect(() => {
    if (loadGraph && jsonFilePath) {
      const fetchData = async () => {
        try {
          const response = await fetch(jsonFilePath);
          const data = await response.json();

          const graph = new Graph();

          data.nodes.forEach((n) => {
            graph.addNode(n.key, {
              size: getNodeSize(n),
              label: n.attributes.label,
              x: Math.random(),
              y: Math.random(),
              color: getNodeColor(n),
            });
          });

          data.edges.forEach((e) => {
            graph.addEdge(e.source, e.target);
          });

          loadGraph(graph);
          assign();
        } catch (error) {
          console.error('Error fetching or parsing JSON:', error);
        }
      };

      fetchData();
    }
  }, [loadGraph, jsonFilePath, assign]);


  return null;
};

function App() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [focusNode, setFocusNode] = useState<string | null>(null);

  const onFocus = useCallback((value: GraphSearchOption | null) => {
    if (value === null) setFocusNode(null);
    else if (value.type === 'nodes') setFocusNode(value.id);
  }, []);

  const onChange = useCallback((value: GraphSearchOption | null) => {
    if (value === null) setSelectedNode(null);
    else if (value.type === 'nodes') setSelectedNode(value.id);
  }, []);

  const postSearchResult = useCallback((options: GraphSearchOption[]): GraphSearchOption[] => {
    return options.length <= 10
      ? options
      : [
        ...options.slice(0, 10),
        {
          type: 'message',
          message: <span className="text-center text-muted">And {options.length - 10} others</span>,
        },
      ];
  }, []);

  return (
    <SigmaContainer style={sigmaStyle}
                    settings={{allowInvalidContainer: true, autoCenter: true, autoRescale: true, zIndex: true}}>
      <FocusOnNode node={focusNode ?? selectedNode} move={focusNode ? false : true}/>
      <ControlsContainer position={'top-left'}>
        <ZoomControl/>
        <FullScreenControl/>
      </ControlsContainer>
      <ControlsContainer position={'top-right'}>
        <GraphSearch
          type="nodes"
          value={selectedNode ? {type: 'nodes', id: selectedNode} : null}
          onFocus={onFocus}
          onChange={onChange}
          postSearchResult={postSearchResult}
        />
      </ControlsContainer>
      <LoadGraphFromJSON jsonFilePath="/nodes.json"/>
    </SigmaContainer>
  );
}

export default App;
