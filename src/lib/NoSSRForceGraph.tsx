import React, { forwardRef, useImperativeHandle } from 'react';
import ForceGraph2D, {
  ForceGraphProps,
  ForceGraphMethods,
} from 'react-force-graph-2d';

interface NoSSRForceGraphProps extends Omit<ForceGraphProps, 'graphData'> {
  data: {
    nodes: { id: string }[];
    links: { source: string; target: string }[];
  };
}

export interface NoSSRForceGraphRef {
  zoomToFit: (duration?: number) => void;
  zoomTo: (zoomLevel: number, duration?: number) => void;
}

const NoSSRForceGraph = forwardRef<NoSSRForceGraphRef, NoSSRForceGraphProps>(
  (props, ref) => {
    const forceGraphRef = React.useRef<ForceGraphMethods<any, any>>(null);

    useImperativeHandle(ref, () => ({
      zoomToFit: (duration) => {
        forceGraphRef.current?.zoomToFit(duration);
      },
      zoomTo: (zoomLevel, duration) => {
        forceGraphRef.current?.zoom(zoomLevel, duration);
      },
    }));

    return (
      <ForceGraph2D ref={forceGraphRef} graphData={props.data} {...props} />
    );
  }
);
NoSSRForceGraph.displayName = 'NoSSRForceGraph';

export default NoSSRForceGraph;
