// Reconstructed from Metro module 727 (decompiled.js lines 278508–279135)
// Directed multigraph with forward and reverse adjacency lists.
// NOTE: the constructor body (function id 4834) was not emitted by the decompiler;
// the three Map fields below are inferred from how every method uses them.

export class CausalTemporalGraph {
  constructor() {
    this.nodes = new Map(); // id -> node object (shallow copy)
    this.adjacencyList = new Map(); // id -> Set<{ targetId, type }>
    this.incomingAdjacencyList = new Map(); // id -> Set<{ sourceId, type }>
  }

  addNode(node) {
    this.nodes.set(node.id, { ...node });
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
    if (!this.incomingAdjacencyList.has(node.id)) {
      this.incomingAdjacencyList.set(node.id, new Set());
    }
  }

  removeNode(nodeId) {
    this.nodes.delete(nodeId);
    this.adjacencyList.delete(nodeId);
    this.incomingAdjacencyList.delete(nodeId);

    for (const [, edges] of this.adjacencyList.entries()) {
      for (const edge of edges) {
        if (edge.targetId === nodeId) {
          edges.delete(edge);
        }
      }
    }

    for (const [, edges] of this.incomingAdjacencyList.entries()) {
      for (const edge of edges) {
        if (edge.sourceId === nodeId) {
          edges.delete(edge);
        }
      }
    }
  }

  addEdge(sourceId, targetId, type) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return;
    }

    const outgoing = this.adjacencyList.get(sourceId) || new Set();
    outgoing.add({ targetId, type });
    this.adjacencyList.set(sourceId, outgoing);

    const incoming = this.incomingAdjacencyList.get(targetId) || new Set();
    incoming.add({ sourceId, type });
    this.incomingAdjacencyList.set(targetId, incoming);
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getNodes() {
    return Array.from(this.nodes.values());
  }

  getEdges() {
    const edges = [];
    for (const [sourceId, outgoing] of this.adjacencyList.entries()) {
      for (const edge of outgoing) {
        edges.push({ sourceId, targetId: edge.targetId, type: edge.type });
      }
    }
    return edges;
  }

  getOutgoingEdges(nodeId) {
    const outgoing = this.adjacencyList.get(nodeId);
    return outgoing ? Array.from(outgoing) : [];
  }

  getIncomingEdges(nodeId) {
    const incoming = this.incomingAdjacencyList.get(nodeId);
    return incoming ? Array.from(incoming) : [];
  }

  // Breadth-first traversal following outgoing edges; calls visitor(id, depth)
  // for every dequeued node and stops expanding once depth >= maxDepth.
  bfs(startId, maxDepth, visitor) {
    if (!this.nodes.has(startId)) {
      return;
    }
    const visited = new Set([startId]);
    const queue = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      visitor(current.id, current.depth);
      if (current.depth >= maxDepth) {
        continue;
      }
      for (const edge of this.getOutgoingEdges(current.id)) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push({ id: edge.targetId, depth: current.depth + 1 });
        }
      }
    }
  }

  // Recursive depth-first traversal following outgoing edges; calls visitor(id).
  dfs(startId, visitor) {
    if (!this.nodes.has(startId)) {
      return;
    }
    const visited = new Set();
    const dfsHelper = (nodeId) => {
      visited.add(nodeId);
      visitor(nodeId);
      for (const edge of this.getOutgoingEdges(nodeId)) {
        if (!visited.has(edge.targetId)) {
          dfsHelper(edge.targetId);
        }
      }
    };
    dfsHelper(startId);
  }
}
