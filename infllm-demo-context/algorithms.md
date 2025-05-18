---
title: Breadth First Search Algorithm Implementation and Analysis
category: Algorithms
tags: graph traversal, shortest paths, graph theory, complexity analysis
description: A comprehensive explanation of the Breadth First Search (BFS) algorithm, including implementation, complexity analysis, and mathematical proofs. The document covers the algorithm's properties for finding shortest paths in graphs and includes Python implementations with detailed theoretical foundations and lemmas about level ordering.
---
# Breadth First Search

Completely explore the vertices of a graph in order of their distance from the starting node.

There are three states of a vertex in BFS:
- **Undiscovered**: The vertex has not been seen yet.
- **Discovered**: The vertex has been seen, but its neighbors have not been explored yet.
- **Explored**: The vertex has been seen and its neighbors have been explored.

### Algorithm

```plaintext
BFS(G, s):
  mark all vertices as undiscovered

  mark s as discovered
  q = queue({s})
  while q is not empty:
    u = poll(q)
    for each edge (u, v) in G:
      if v is undiscovered:
        mark v as discovered
        add v to q
    mark u as explored
```

### Analysis

The outer while loop runs once for each vertex in the graph, and the inner for loop runs once for each edge of the current node. Remembering that the sum of the degrees of all vertices is equal to twice the number of edges in the graph, we have...

$$
O(|V|) + O(\sum_{v \in V} deg(v)) = O(|V| + |E|)
$$

### Lemmas


1. $BFS(s)$ visits a vertex $v$ if and only if there is a path from $s$ to $v$.
2. Edges into then-unexplored vertices form a tree rooted at $s$ (the **BFS spanning tree**).
3. Level $i$ in the tree are exactly all vertices $v$ stuch that the shortest path from $s$ to $v$ has $i$ edges.
4. All non-tree edges from $G$ connect vertices in the same level or adjacent levels.


### Difference in levels

Let $L(v)$ be the level of vertex $v$ in a BFS tree of interest.

Claim:
$$
\forall (x, y) \in E, |L(x) - L(y)| \le 1
$$

Proof:
Suppose $L(x) = i$ and $L(y) = j$. Without loss of generality, assume $x$ is explored before $y$.

Consider the iteration where we process $x$.

Case 1: $y$ is still undiscovered. Since there is an edge between $x$ and $y$, we will discover $y$ in the next iteration, and so $L(y) = i + 1$.

Case 2: $y$ is discovered. Then $y$ is already in the queue, somewhere before $x$. We know $L(y) \ge i$ because $x$ was discovered before $y$. Since the levels are non-decreasing, and $L(x) = i$, we have $L(y) \le i + 1$.

Thus, $|L(x) - L(y)| \le 1$.


### Shortest paths

Claim:

For every vertex $v \in V$ reachable from $s$, $L(v)$ is the length of the shortest path from $s$ to $v$.

Proof:

Let $l(v)$ be the length of the shortest path from $s$ to $v$.

We have that $L(v) \ge l(v)$, since $L(v)$ is the length of a valid path from $s$ to $v$, so the shortest path must be at least as short.

Next, we must show that $L(v) \le l(v)$.

Let $v_0, v_1, \ldots, v_k$ be the shortest path from $s$ to $v$ (with $v_0 = s$).







$$
\forall v \in BFS(G, s), L(v) = \text{length of the shortest path from } s \text{ to } v
$$



```python
from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    while queue:
        vertex = queue.popleft()
        print(vertex)
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

Or a reusable level-order iterator over a graph using BFS:

```python
from collections import deque

def level_order_traversal(graph, start):
    queue = deque([(start, 0)])
    while queue:
        vertex, level = queue.popleft()
        yield vertex, level
        for neighbor in graph[vertex]:
            queue.append((neighbor, level + 1))
```---
title: Depth First Search Algorithm and Tree Properties
category: Algorithms
tags: graph theory, depth first search, spanning trees, graph traversal
description: A technical explanation of Depth First Search (DFS) algorithm and its tree properties, including both recursive and iterative implementations. The document covers key properties of DFS trees, including the ancestor-descendant relationship of non-tree edges, and includes a formal lemma and proof about DFS tree characteristics.
---

# Depth First Search (DFS)

Running DFS on a graph produces a DFS tree (or depth-first spanning-tree). The DFS tree contains all the vertices of the graph and the edges of the DFS tree are a subset of the edges of the original graph.

Unlike the BFS tree, DFS trees aren't minimum depth, and its levels don't really tell you much. However, the property holds that sub-trees of a DFS tree must not contain any edges connecting them.

**Lemma**: For a DFS tree of graph $G = (V, E)$ $T = (V_t, E_t)$,  $\forall e = (x, y) \in E$, if $e \notin E_t$, then one of $x$ or $y$ is an ancestor of the other in the tree.

**Proof**: Without loss of generality, assume $x$ is discovered first.

Call $dfs(x)$. At this time, $y$ is still undiscovered. By observation, it is enough to say $y$ will be discovered before finishing $dfs(x)$. This is true because $y$ is a neighbor of $x$, so DFS will eventually visit $y$. If $y$ is still undiscovered when $x$ we visit $x$'s neighbors, it will at least be discovered then.


```python

def dfs_recursive(G, src, vis = set(), f=print):
  if src in vis:
    return
  vis.add(src)
  f(src)
  for v in G[src]:
    dfs_recursive(G, v, vis)

def dfs_iterative(G, src, vis=set(), f=print):
  stack = [src]
  while stack:
    curr = stack.pop()
    if curr in vis:
      continue
    vis.add(curr)
    f(curr)
    for v in G[curr]:
      stack.append(v)
```

## Properties of DFS Spanning Trees

DFS visits every vertex within the starting vertex's connected component, so you can use it to find all connected components of a graph similar to BFS.

However, unlike BFS, the DFS tree has the property that every non-tree edge joins a vertex to one of its ancestors/decedents in the tree. We can thus still use DFS to find cycles in a graph.

---
title: Bipartite Graphs Properties, Proofs, and Detection Algorithm
category: Algorithms
tags: bipartite graphs, graph coloring, odd cycles, breadth-first search
description: A comprehensive overview of bipartite graphs, including their formal definition and key properties related to vertex coloring and odd-length cycles. The document presents important lemmas about the relationship between bipartite graphs and odd cycles, along with proofs using BFS layer analysis for bipartite graph detection.
---

# Bipartite Graphs

- **Definition**: An undirected graph $G = (V, E)$ is bipartite if there exists a partition of $V$ into two sets $V_1$ and $V_2$ such that every edge in $E$ has one endpoint in $V_1$ and the other in $V_2$.
- **Applications**:
  - Scheduling (machines = $V_1$, jobs = $V_2$)
  - Stable matching (men = $V_1$, women = $V_2$)

You can tell if a graph is bipartite if there is a proper coloring of vertices, i.e., you can assign one of two colors to each vertex such that no two adjacent vertices have the same color. Many problems become easier if the underlying graph is bipartite graphs.

## Odd-Length Cycles

**Lemma**: If $G$ is bipartite, then it does not contain an odd-length cycle.
**Proof**: You cannot 2-color an odd cycle, let alone $G$.

**Lemma**: Let $G$ be a connected graph, and let $L_0, \ldots, L_k$ be the layers produced by $BFS(s)$. Then exactly one of the following holds:

1. No edges of $G$ joins two nodes of the same layer, and $G$ is bipartite.
2. An edge of $G$ joins two nodes of the same layer, and $G$ contains an odd cycle (and is thus not bipartite).

**Proof**: If an edge joins two nodes of the same layer, then the path from the lowest common ancestor of the two nodes to each node forms an odd length cycle. This must be the case, since any edges between two vertices of the same level connects two paths of the same length back to their LCA of the BFS tree. The length of this cycle is thus $2k + 1$, where $k$ is the length of back to the LCA, and the $1$ comes from the edge between the two nodes in the same level.


## Algorithm

**Problem**: Given a graph $G$, output `true` if it is bipartite, `false` otherwise.

---
title: Introduction to Undirected Graphs and Their Properties
category: Algorithms
tags: graph, graph fundamentals, graph representation, graph properties, data structures
description: A comprehensive introduction to undirected graphs covering fundamental concepts, properties, and storage methods. The document explains key terminology, proves important theorems about degree sums and odd vertices, and compares adjacency matrix and list representations with their respective time and space complexities.
---

# Graphs Introduction

## Undirected Graphs

An undirected graph is defined by a set of vertices and a set of edges.

$$
G = (V, E)
$$

### Terminology

- **Connectedness**: A graph is connected if there is a path between every pair of vertices.
- **Isolated vertex**: A vertex with no edges.
- **Planar graph**: You can draw the graph on a plane such that no two edges cross.
- **Degree of vertex**: $deg(v) = $ Number of edges that touch said vertex.
- **Connected components**: maximal set of components within a graph. Partition your set of vertices
- **Path**: A sequence of distinct vertices s.t. each vertex is connected to the next vertex with an edge. `length(path) = # edges`
- **Cycle**: Path of length > 2 that has the same start and end
- **Tree**: A connected graph with no cycles.

### Degree Sum

#### Claim 
In any undirected graph, the number of edges is half the sum of all vertices degrees.

$$
\text{edges } = \frac{1}{2} \sum_{v \in V} deg(v)
$$

#### Proof: 
The sum counts each edge twice.

### Odd Degree Vertices

#### Claim
In any undirected graph, the number of odd degree vertices is even.

#### Proof
Adding any two odd numbers results in an even number. Adding an odd and even number is odd. With this in mind, knowing that the sum of all vertex degrees is even,there must be even number of odd degree vertices, because sum of odd number of odd numbers is odd.

### Degree 1 vertices

#### Claim

Suppose $G$ is an acyclic graph. Then $G$ must have a vertex of degree less than or equal to 1.

$$
G = (V, E) \text{ is acyclic} \to \exists v \in V, deg(v) \le 1
$$

#### Proof

Proof by contradiction.

Assume $\forall v \in V, d(v) \ge 2$.

Consider a path from $v_1$ to $v_n$. At $v_i$, we choose the next vertex such that isnt an edge to $v_{i - 1}$, which is possible because $deg(v_i) \ge 2$. The first time we see a repeated vertex $v_j = v_i$, we get a cycle. Since $G$ has finitely many edges, at some point you need to either terminate your traversal, or loop back and repeat a node.

### Number of edges

Let $G = (V, E)$ be a graph with $n = |V|$ vertices and $m = |E|$ edges.

Claim: $m \le (n \choose 2) = \frac{n(n - 1)}{2} = O(n^2)$

Proof: Each vertex can be connected to at most $n - 1$ other vertices. Thus, the total number of edges is at most $n(n - 1)/2$.

### Sparsity

A graph is called sparse if $|E| << |V|^2$, and dense otherwise. Sparse graphs are common in applications like social networks, the web, planar graphs, etc.

Technically, $O(n + m) = O(n^2)$, but in practice, $O(n + m) = O(n)$ for sparse graphs.

### Storing Graphs

#### Adjacency Matrix

A matrix $A$ where $A_{ij} = 1$ if there is an edge between $v_i$ and $v_j$, and $0$ otherwise.

- Pro: $O(1)$ time to check if there is an edge between two vertices.
- Con: $O(n^2)$ space.
- Con: $O(n)$ time to find all neighbors of a vertex.

Good for dense graphs.

#### Adjacency List

A list of lists, where each vertex has a list of its neighbors.

- Pro: $O(1)$ time to find all neighbors of a vertex.
- Pro: $O(n + m)$ space.
- Con: $O(n)$ time to check if there is an edge between two vertices.

Good for sparse graphs.

```python

def build_adjacency_list(n: int, edges: List[Tuple[int, int]]) -> List[List[int]]:
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    return adj

def build_adjacency_matrix(n: int, edges: List[Tuple[int, int]]) -> List[List[int]]:
    adj = [[0] * n for _ in range(n)]
    for u, v in edges:
        adj[u][v] = 1
        adj[v][u] = 1
    return adj

```
---
title: Topological Ordering and Properties of Directed Acyclic Graphs
category: Algorithms
tags: graph theory, topological sorting, directed acyclic graphs, proofs
description: A technical exploration of Directed Acyclic Graphs (DAGs) focusing on their topological ordering properties and fundamental lemmas. The document includes mathematical proofs of key DAG properties and presents a Python implementation of the topological sorting algorithm.
---

# Directed Acyclic Graphs (DAGs)

DAGs are pretty self explanatory, but their use cases are vast.

## Topological Orderings

A **topological ordering** of a directed graph $G = (V, E)$ is a linear ordering of all its vertices such that for every directed edge $(v_i, v_j) \in E$, $v_i$ comes before $v_j$ in the ordering if $v_i < v_j$.

**Lemma**: If $G$ has a topological ordering, then $G$ is a DAG.
**Proof**: For contradiction, assume $G$ has a cycle $v_0, \ldots , v_k$, as well as a topological ordering.

We can order vertices $u_1, \ldots, u_n$ such that $\forall \text{ directed edges } i \to j$, we have $i < j$.

Take the smallest $u_i = v_j$ in the cycle mentioned previously. Then $v_{j - 1} \to v_{j}$ and $v_{j} \to v_{j + 1}$ violate our ordering, since $v_j$ was the minimum in the topological ordering (so both $v_{(j - 1) \mod k}$ and $v_{(j + 1) \mod k}$ are greater).

**Lemma**: If $G$ is a DAG, then $G$ has a source vertex ($indeg(v) = 0$).
**Proof**: Suppose for contradiction that $G$ has no source vertex.

i.e., $\forall v \in V, \, indeg(v) \ge 1$

Consider an arbitrary vertex $v_1$. Then $v_1$ has some neighbor(s) $v_2, \ldots$ with an edge into it. Similarly, $v_2$ has some neighbor(s) $v_i, \ldots$ with edges coming into it. You can continue this logic, and must eventually find a repeating vertex, since there are finitely many vertices.

### Algorithm

```python
def topological_sort(G):
  order = []
  count = [0] * len(G)
  S = { v for v in G if not G[v] }
  for v in G
    for u in G[v]:
      count[u] += 1

  while S:
    v = S.pop()
    order.append(v)

    for u in G[v]:
      count[u] -= 1
      if count[u] == 0:
        S.add(u)

  return order
```
