import * as d3 from 'd3';
import { EntityResponse, RelationshipResponse } from 'r2r-js';
import React, { useEffect, useRef, useState } from 'react';

interface KnowledgeGraphProps {
  entities: EntityResponse[];
  relationships: RelationshipResponse[];
  width: number;
  height: number;
  maxNodes?: number;
}

// Define proper node and link types for D3
interface GraphNode {
  id: string;
  name: string;
  category: string;
  connections: number;
  entity: EntityResponse;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  predicate: string;
  relationship: RelationshipResponse;
}

const KnowledgeGraphD3: React.FC<KnowledgeGraphProps> = ({
  entities,
  relationships,
  width,
  height,
  maxNodes = 100, // Default value for maxNodes
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [originalCounts, setOriginalCounts] = useState({
    entities: 0,
    relationships: 0,
  });

  useEffect(() => {
    setOriginalCounts({
      entities: entities.length,
      relationships: relationships.length,
    });

    if (!svgRef.current || entities.length === 0) {
      return;
    }

    // Clear any previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    try {
      // STEP 1: Create maps of entities by both ID and name
      const entityMap = new Map<string, EntityResponse>();
      const entityNameMap = new Map<string, EntityResponse[]>();

      entities.forEach((entity) => {
        entityMap.set(entity.id, entity);

        if (entity.name) {
          if (!entityNameMap.has(entity.name)) {
            entityNameMap.set(entity.name, []);
          }
          entityNameMap.get(entity.name)?.push(entity);
        }
      });

      // STEP 2: Count connections using name-based lookup
      const connectionCounts = new Map<string, number>();
      const relationshipsByName = new Map<string, Set<string>>();

      // Initialize connectionCounts with all entity IDs
      entities.forEach((entity) => {
        connectionCounts.set(entity.id, 0);
        if (entity.name && !relationshipsByName.has(entity.name)) {
          relationshipsByName.set(entity.name, new Set());
        }
      });

      // Count connections using name matching
      relationships.forEach((rel) => {
        if (rel.subject && rel.object) {
          // Track what relationships each entity name participates in
          if (relationshipsByName.has(rel.subject)) {
            relationshipsByName.get(rel.subject)?.add(rel.id);
          }
          if (relationshipsByName.has(rel.object)) {
            relationshipsByName.get(rel.object)?.add(rel.id);
          }

          // Count connections for subject entities
          const subjectEntities = entityNameMap.get(rel.subject) || [];
          subjectEntities.forEach((entity) => {
            const count = connectionCounts.get(entity.id) || 0;
            connectionCounts.set(entity.id, count + 1);
          });

          // Count connections for object entities
          const objectEntities = entityNameMap.get(rel.object) || [];
          objectEntities.forEach((entity) => {
            const count = connectionCounts.get(entity.id) || 0;
            connectionCounts.set(entity.id, count + 1);
          });
        }
      });

      // STEP 3: For each entity name, select the entity instance with the most connections
      const bestEntityByName = new Map<string, string>(); // Maps entity name to its best entity ID

      for (const [name, entities] of entityNameMap.entries()) {
        if (entities.length > 0) {
          // Find the entity with the most connections
          const bestEntity = entities.reduce((best, current) => {
            const bestCount = connectionCounts.get(best.id) || 0;
            const currentCount = connectionCounts.get(current.id) || 0;
            return currentCount > bestCount ? current : best;
          }, entities[0]);

          bestEntityByName.set(name, bestEntity.id);
        }
      }

      // STEP 4: Find entities that participate in actual relationships
      // Create a set of entity names that have relationships
      const entityNamesWithRelationships = new Set<string>();
      relationships.forEach((rel) => {
        if (rel.subject) entityNamesWithRelationships.add(rel.subject);
        if (rel.object) entityNamesWithRelationships.add(rel.object);
      });

      // Get the IDs of the best entities that have relationships
      const connectedEntityIds = Array.from(entityNamesWithRelationships)
        .filter((name) => bestEntityByName.has(name))
        .map((name) => bestEntityByName.get(name) as string);

      // STEP 5: Sort by connection count and take top nodes
      const sortedEntityIds = connectedEntityIds
        .sort(
          (a, b) =>
            (connectionCounts.get(b) || 0) - (connectionCounts.get(a) || 0)
        )
        .slice(0, maxNodes); // Apply the maxNodes limit here

      // Create a set for O(1) lookups
      const selectedEntityIds = new Set(sortedEntityIds);

      // STEP 6: Create nodes from the selected entity IDs
      const nodes: GraphNode[] = sortedEntityIds
        .map((id) => {
          const entity = entityMap.get(id);
          if (!entity) {
            return null;
          }

          return {
            id,
            name: entity.name || id.substring(0, 8),
            category: entity.category || 'Unknown',
            connections: connectionCounts.get(id) || 0,
            entity,
          };
        })
        .filter((node): node is GraphNode => node !== null);

      // Create a map of nodes by ID for O(1) lookups
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((node) => {
        nodeMap.set(node.id, node);
      });

      // Create a map of entity names to node objects for quick lookup
      const nodeNameMap = new Map<string, GraphNode>();
      nodes.forEach((node) => {
        nodeNameMap.set(node.name, node);
      });

      // STEP 7: Create links between selected nodes
      const links: GraphLink[] = [];

      relationships.forEach((rel) => {
        if (rel.subject && rel.object) {
          const sourceNode = nodeNameMap.get(rel.subject);
          const targetNode = nodeNameMap.get(rel.object);

          if (sourceNode && targetNode) {
            links.push({
              source: sourceNode,
              target: targetNode,
              predicate: rel.predicate,
              relationship: rel,
            });
          }
        }
      });

      // Update state for display
      setNodeCount(nodes.length);
      setLinkCount(links.length);

      // If no nodes, early exit
      if (nodes.length === 0) {
        console.error('No nodes to display in the graph');
        return;
      }

      // STEP 8: Create the visualization
      const svg = d3
        .select(svgRef.current)
        .attr('viewBox', [-width / 2, -height / 2, width, height])
        .attr('width', width)
        .attr('height', height);

      // Create tooltip with enhanced styling
      const tooltip = d3
        .select(tooltipRef.current)
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background-color', 'rgba(33, 33, 33, 0.95)')
        .style('color', 'white')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 20px rgba(0, 0, 0, 0.3)')
        .style('padding', '12px 16px')
        .style('font-family', 'Inter, system-ui, sans-serif')
        .style('font-size', '14px')
        .style('max-width', '300px')
        .style('backdrop-filter', 'blur(4px)')
        .style('z-index', 1000);

      // Define color scale with a more pleasing palette
      const categoryColorScale = d3
        .scaleOrdinal()
        .domain(Array.from(new Set(nodes.map((n) => n.category))))
        .range([
          '#3498db',
          '#e74c3c',
          '#2ecc71',
          '#f39c12',
          '#9b59b6',
          '#1abc9c',
          '#d35400',
          '#34495e',
          '#16a085',
          '#c0392b',
          '#8e44ad',
          '#27ae60',
          '#e67e22',
          '#2980b9',
        ]);

      // Define node size scale with a better range
      const nodeSize = d3
        .scaleLog()
        .domain([
          Math.max(1, d3.min(nodes, (d) => d.connections) || 1),
          Math.max(2, d3.max(nodes, (d) => d.connections) || 2),
        ])
        .range([5, 20])
        .clamp(true);

      // Create links with better styling
      const link = svg
        .append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#aaa')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 0.8)
        .on('mouseover', function (event, d) {
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 1);

          tooltip.transition().duration(150).style('opacity', 1);

          const sourceNode =
            typeof d.source === 'object'
              ? d.source
              : nodeMap.get(d.source as string);
          const targetNode =
            typeof d.target === 'object'
              ? d.target
              : nodeMap.get(d.target as string);

          tooltip
            .html(
              `
            <div style="margin-bottom: 8px; font-weight: 600; font-size: 16px; color: #f0f0f0;">
              ${d.predicate}
            </div>
            <div style="display: flex; margin-bottom: 12px;">
              <div style="width: 6px; background-color: ${categoryColorScale(sourceNode?.category || 'Unknown')}; margin-right: 10px;"></div>
              <div>
                <div style="color: #ccc; font-size: 12px;">From</div>
                <div style="font-weight: 500;">${sourceNode?.name || 'Unknown'}</div>
              </div>
            </div>
            <div style="display: flex;">
              <div style="width: 6px; background-color: ${categoryColorScale(targetNode?.category || 'Unknown')}; margin-right: 10px;"></div>
              <div>
                <div style="color: #ccc; font-size: 12px;">To</div>
                <div style="font-weight: 500;">${targetNode?.name || 'Unknown'}</div>
              </div>
            </div>
          `
            )
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('stroke', '#aaa')
            .attr('stroke-width', 0.8)
            .attr('stroke-opacity', 0.6);

          tooltip.transition().duration(300).style('opacity', 0);
        });

      // Create nodes with better styling and interactions
      const node = svg
        .append('g')
        .attr('class', 'nodes')
        .selectAll<SVGCircleElement, GraphNode>('circle') // Explicitly specify types here
        .data(nodes)
        .join('circle')
        .attr('r', (d) => nodeSize(d.connections))
        .attr('fill', (d) => categoryColorScale(d.category) as string)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8)
        .on('mouseover', function (event, d) {
          // Highlight the node
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 1);

          // Highlight connected links with proper return types
          link
            .attr('stroke', (l): string => {
              const source =
                typeof l.source === 'object' ? l.source.id : l.source;
              const target =
                typeof l.target === 'object' ? l.target.id : l.target;
              return source === d.id || target === d.id ? '#fff' : '#aaa';
            })
            .attr('stroke-opacity', (l): number => {
              const source =
                typeof l.source === 'object' ? l.source.id : l.source;
              const target =
                typeof l.target === 'object' ? l.target.id : l.target;
              return source === d.id || target === d.id ? 1 : 0.1;
            })
            .attr('stroke-width', (l): number => {
              const source =
                typeof l.source === 'object' ? l.source.id : l.source;
              const target =
                typeof l.target === 'object' ? l.target.id : l.target;
              return source === d.id || target === d.id ? 2 : 0.5;
            });

          // Fade non-connected nodes with proper return type
          node.attr('opacity', (n): number => {
            // Check if this node is connected to the hovered node
            const isConnected = links.some((l) => {
              const source =
                typeof l.source === 'object' ? l.source.id : l.source;
              const target =
                typeof l.target === 'object' ? l.target.id : l.target;
              return (
                (source === d.id && target === n.id) ||
                (target === d.id && source === n.id)
              );
            });
            return n.id === d.id || isConnected ? 1 : 0.3;
          });

          // Show tooltip
          tooltip.transition().duration(150).style('opacity', 1);

          tooltip
            .html(
              `
              <div style="margin-bottom: 8px; font-weight: 600; font-size: 16px;">${d.name}</div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="width: 12px; height: 12px; background-color: ${categoryColorScale(d.category)}; border-radius: 50%; margin-right: 8px;"></div>
                <div style="color: #ccc; margin-right: 4px;">Type:</div>
                <div style="font-weight: 500;">${d.category}</div>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="color: #ccc; margin-right: 4px;">Connections:</div>
                <div style="font-weight: 600;">${d.connections}</div>
              </div>
              ${d.entity.description ? `<div style="margin-top: 8px; font-size: 13px; color: #ddd; line-height: 1.4;">${d.entity.description.substring(0, 150)}${d.entity.description.length > 150 ? '...' : ''}</div>` : ''}
              <div style="margin-top: 10px; font-size: 11px; color: #888;">ID: ${d.id.substring(0, 8)}...</div>
            `
            )
            .style('left', event.pageX + 15 + 'px')
            .style('top', event.pageY - 15 + 'px');
        })
        .on('mouseout', function () {
          // Reset node appearance
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.8);

          // Reset all links
          link
            .attr('stroke', '#aaa')
            .attr('stroke-width', 0.8)
            .attr('stroke-opacity', 0.6);

          // Reset all nodes
          node.attr('opacity', 1);

          // Hide tooltip
          tooltip.transition().duration(300).style('opacity', 0);
        })
        .call(
          d3
            .drag<SVGCircleElement, GraphNode>()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );

      // Add labels for important nodes with better styling
      const labelThreshold = Math.max(
        d3.quantile(
          nodes.map((d) => d.connections),
          0.85
        ) || 3,
        nodes.length > 100 ? 5 : 2
      );

      const label = svg
        .append('g')
        .attr('class', 'labels')
        .selectAll<SVGTextElement, GraphNode>('text')
        .data(nodes.filter((d) => d.connections > labelThreshold))
        .join('text')
        .text((d) => d.name)
        .attr('font-size', (d) => Math.min(10 + d.connections / 10, 16))
        .attr('font-weight', 500)
        .attr('dx', (d) => nodeSize(d.connections) + 5) // Ensure this returns a number
        .attr('dy', 4)
        .attr('fill', '#fff')
        .attr('stroke', 'rgba(0, 0, 0, 0.75)')
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('paint-order', 'stroke')
        .attr('pointer-events', 'none');

      // Get unique categories (limit to most common ones)
      const categoryCounts = new Map<string, number>();
      nodes.forEach((n) => {
        categoryCounts.set(
          n.category,
          (categoryCounts.get(n.category) || 0) + 1
        );
      });

      const categories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([category]) => category);

      // STEP 9: Create the force simulation with better physics
      const simulation = d3
        .forceSimulation<GraphNode>(nodes)
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(0, 0))
        .force('collide', d3.forceCollide().strength(0.7))
        .force('x', d3.forceX(0).strength(0.03))
        .force('y', d3.forceY(0).strength(0.03));

      // Add the link force separately to ensure proper connections
      simulation.force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => 120) // Increase minimum link distance
          .strength(0.5) // Decrease link strength to allow more flexibility
      );

      // Tick function to update positions
      simulation.on('tick', () => {
        link
          .attr('x1', (d) => {
            const source = d.source as any;
            return source.x as number;
          })
          .attr('y1', (d) => {
            const source = d.source as any;
            return source.y as number;
          })
          .attr('x2', (d) => {
            const target = d.target as any;
            return target.x as number;
          })
          .attr('y2', (d) => {
            const target = d.target as any;
            return target.y as number;
          });

        node.attr('cx', (d) => d.x as number).attr('cy', (d) => d.y as number);

        label.attr('x', (d) => d.x as number).attr('y', (d) => d.y as number);
      });

      // Drag functions
      function dragstarted(
        event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>
      ) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(
        event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>
      ) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(
        event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>
      ) {
        if (!event.active) simulation.alphaTarget(0);
        // Keep node fixed if shift key is held down during drag end
        if (!event.sourceEvent.shiftKey) {
          event.subject.fx = null;
          event.subject.fy = null;
        }
      }

      // Add zoom capability with better defaults
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          svg.selectAll('g').attr('transform', event.transform.toString());
        });

      svg.call(zoom);

      // Optional: Run the simulation with a higher alpha for a while
      // to get a better initial layout
      simulation.alpha(4).restart();

      // Cleanup
      return () => {
        simulation.stop();
      };
    } catch (error) {
      console.error('Error creating knowledge graph:', error);
    }
  }, [entities, relationships, width, height, maxNodes]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full bg-gray-900" />
      <div
        ref={tooltipRef}
        className="absolute top-0 left-0 pointer-events-none"
      />
    </div>
  );
};

export default KnowledgeGraphD3;
