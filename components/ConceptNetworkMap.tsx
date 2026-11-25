
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  isRoot?: boolean;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
  label?: string;
}

interface ConceptData {
  nodes: Node[];
  links: Link[];
}

interface ConceptNetworkMapProps {
  data: ConceptData;
  onNodeDoubleClick?: (nodeId: string) => void;
}

export const ConceptNetworkMap: React.FC<ConceptNetworkMapProps> = ({ data, onNodeDoubleClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const width = 800; // Standard width, will be responsive via viewBox
    const height = 500;

    // Clear previous contents
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force("link", d3.forceLink<Node, Link>(data.links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Add arrow definition
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#999")
      .style("stroke", "none");

    const container = svg.append("g")
      .attr("class", "zoom-container");

    const linkGroup = container.append("g").attr("class", "links");
    const link = linkGroup.selectAll("line")
      .data(data.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
      .attr("marker-end", "url(#arrowhead)");

    const linkLabel = linkGroup.selectAll("text")
      .data(data.links)
      .enter().append("text")
      .attr("font-size", "9px")
      .attr("fill", "#666")
      .attr("text-anchor", "middle")
      .attr("class", "dark:fill-gray-400 italic pointer-events-none")
      .text(d => d.label || "");

    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
      .enter().append("g")
      .on("dblclick", (event, d) => {
        if (onNodeDoubleClick) {
          onNodeDoubleClick(d.id);
        }
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("path")
      .attr("d", d => {
        if (d.isRoot) return d3.symbol().type(d3.symbolDiamond).size(400)();
        return d.group === 5 
          ? d3.symbol().type(d3.symbolSquare).size(200)() 
          : d3.symbol().type(d3.symbolCircle).size(200)();
      })
      .attr("fill", d => color(String(d.group)))
      .attr("stroke", d => d.isRoot ? "#000" : (d.group === 5 ? "#4f46e5" : "none"))
      .attr("stroke-width", d => d.isRoot ? 3 : 2);

    node.append("text")
      .text(d => d.id)
      .attr('x', 16)
      .attr('y', 4)
      .attr("font-size", d => d.isRoot ? "14px" : (d.group === 5 ? "10px" : "12px"))
      .attr("font-weight", d => d.isRoot ? "bold" : "normal")
      .attr("class", d => {
        let base = d.group === 5 
          ? "fill-indigo-600 dark:fill-indigo-400 italic" 
          : "fill-gray-700 dark:fill-gray-300 font-medium";
        if (d.isRoot) base = "fill-gray-900 dark:fill-white font-bold";
        return base + " pointer-events-none";
      });

    node.append("title")
      .text(d => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      linkLabel
        .attr("x", d => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr("y", d => ((d.source as Node).y! + (d.target as Node).y!) / 2 - 5);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="w-full h-[500px] border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden relative group">
      <div className="absolute top-4 left-4 z-10">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Concept Relationship Network</h4>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 800 500"
        width="800"
        height="500"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
      <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Interactive Force-Directed Graph • Drag nodes to explore • Scroll to zoom
      </div>
    </div>
  );
};
