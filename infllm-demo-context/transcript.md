You:
I am going to give you large documents covering various topics. Each time I want you to summarize the topics covered in short bullet points.
Model:
Sure, I can help you with that. Please go ahead and provide the documents.

You:
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

**Lemma**: For a DFS tree of graph $G = (V, E)$ $T = (V_t, E_t)$, $\forall e = (x, y) \in E$, if $e \notin E_t$, then one of $x$ or $y$ is an ancestor of the other in the tree.

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
Model:
Breadth First Search (BFS) is a classic algorithm for traversing or searching a graph. It starts from a root node and explores its neighbors before moving on to the neighbors of those neighbors, and so on. BFS uses a queue data structure to keep track of the nodes to be visited.
The time complexity of BFS is O(V+E), where V is the number of vertices and E is the number of edges in the graph. This is because BFS must visit every vertex and every edge in the graph. The space complexity of BFS is O(V), because it uses a queue data structure to keep track of the nodes to be visited.
The depth-first search (DFS) algorithm is similar to BFS, but it starts from a random vertex and explores its neighbors before moving on to the neighbors of those neighbors, and so on. DFS uses a recursive algorithm to visit the nodes, while BFS uses an iterative algorithm.
The topological ordering of a directed graph is a linear ordering of its vertices such that for every directed edge $(u, v) \in E$, vertex $u$ comes before vertex $v$ in the ordering. A topological ordering of a directed acyclic graph (DAG) is always possible and can be found using the topological sorting algorithm

You:
---
title: Network Components and Protocols
category: Networks
tags: network components, network protocols, network layers, OSI model, network interfaces, encapsulation, demultiplexing
description: Describes the components of a network, including hosts, routers, links, and applications. It also covers the concept of network boundaries and interfaces, and the advantages and disadvantages of network layering. The OSI model is introduced, along with the actual Internet Protocol Stack.
---

# Network Components

## Parts of a network

**Application** (app, user) - The application is the program that is running on the computer. It is the program that is using the network to communicate with other computers. Examples of applications are web browsers, email clients etc.

**Host** (end system, edge device, node) - The host is the computer that is running the application. It is the computer that is using the network to communicate with other computers. Examples of hosts are desktop computers, laptops, mobile phones etc.

**Router** (switch, node, hub) - Device used to relay messages between links. Connects networks together. Examples of routers are home routers/access points, cabel/DSL modems etc.

**Link** (channel) - A connection between nodes. Examples of links are Ethernet cables, fiber optic cables, wireless connections etc.

### Types of links

- **Full-duplex** - Both nodes can send and receive at the same time. *Bidirectional*. Ex: ethernet
- **Half-duplex** - Only one node can send at a time. *Bidirectional*. Ex: WiFi
- **Simplex** - Only one node can send at a time. *Unidirectional*. Ex:

### Wireless Links

Messages are **broadcast**. All nodes in range recieve the message. Often, in graph depictions of a network, only the logical (but not all possible) links are shown.

## Network Names by Scale

**Personal Area Network** (PAN) - A network that is available in a single person's vicinity.

*Examples*: Bluetooth, USB, FireWire etc.

**Local Area Network** (LAN) - A network that is available in a single building.

*Examples*: Ethernet, WiFi etc.

**Metropolitan Area Network** (MAN) - A network that is available in a city.

*Examples*: cable TV, DSL etc.

**Wide Area Network** (WAN) - A network that is available in a country or geographic location.

*Examples*: a large ISP, 3G/4G wireless networks etc.

**Internet** - A network that is available globally.

*Examples*: the Internet.


When you connect multiple networks, you get an **internetwork**, or **internet**. The Internet (capital I) is the internet we all know and love.

#### Switched Network

**Switched networks** forward messages from node-to-node, until they reach their destination. The two most common switched networks are **circuit-switched** (phones) and **packet-switched** (most computer networks) networks.

```txt
+-- (Host) --+
| |
(Link) |
| | logical
+-- (Host) | link
| |
(Link) |
| |
+-- (Host) --+
```

Packet switched networks (PSN) send data in discrete chunks, called **packets**, or messages. PSNs typically use **store-and-forward** switching, where the entire packet is received and loaded into memory, then forwarded to the next node. This is opposed to a circuit switched network, where a stream of data is sent over a maintained connection.

Networks use an _address_ to identify the destination of a packet. Packets can be sent from node to node (_unicast_), but also to all other nodes _(broadcast_), or to a subset of nodes (_multicast_).



## Network Boundaries

```
(Router) --- (Host) --- client
|
(Link)
|
(Router) --- (Host) --- server
```

#### What part is the network?

Everything that isn't the application level. Some people do and don't include the host, but in this course we do.

#### Can think of "the cloud" as a generic network...

```
+-- (Host) --- client
|
(Cloud)
|
+-- (Host) --- server
```

## Key Interfaces

The network is designed to be modular, and there are clearly defined interfaces betweem (1) apps and the network, and (2) the network components themselves.

This is achieved through **protocols** and **layering**.

- Each instance of a protocol communicates to its peer through the same protocol.
- Each instance of a protocol uses only the services of the layer below it.

*"Protocols are horrizontal, and layers are vertical."*

```
# define protocols X, Y,
# where Y is a lower below X


(comm using X)
X <---------------> X <- (peers)
^ ^
| <- (Y service) -> |
| |
Y <---------------> Y <- (peers)
(comm using Y)
```

#### Examples of protocols:
TCP, UDP, HTTP, FTP, SMTP, POP3, IMAP, DNS, DHCP, ARP, ICMP, IP, Ethernet, WiFi, Bluetooth, USB, FireWire, DSL, cable TV, 3G/4G, etc.

#### Example of a stack
```
(browser)
||
+--------+
| HTTP |
+--------+
| TCP |
+--------+
| IP |
+--------+
| 802.11 |
+--------+
||
++==>
```


### Encapsulation

Protocol layering is built upon literal encapsulation of data. Each lower level protocol wraps the higher level protocol's data in its own format with extra information. Similar to putting a letter in an envelope, and then sending it to someone in the mail.

The message "on the wire" for the above stack might look like...

```
+------+
| HTTP |
+------+
+-----+------+
| TCP | HTTP |
+-----+------+
+----+-----+------+
| IP | TCP | HTTP |
+----+-----+------+
+--------+----+-----+------+
| 802.11 | IP | TCP | HTTP |
+--------+----+-----+------+
```

When two nodes communicate, the sender builds up these layers until the data is ready to be transported over the physical medium. Then, once the data is recieved, the reciever peels back the layers until it reaches the application layer.

It is more involved that this diagram in practice. Trailers and headers of each request segment are needed, and the content is often encrypted or compressed. Furthermore, segmentation and reassembly happens when nodes communicate as well.

### Demultiplexing

When a message is recieved, it needs to be passed through exactly the protocols that use it. This is done using **demultiplexing keys** found in the headers of each protocol. Ex: IP protocol field, TCP port number, etc.

### Advantages of Layering

- **Modularity** - Each layer can be changed without affecting the other layers, so long as the interface remains the same.
- **Abstraction** - Each layer can be thought of as a black box. Information hiding can be used to connect different systems that rely on different protocols under the hood.
- **Standardization** - Each layer can be standardized, and then implemented by many different vendors.

For example, when a person submits a request on their home wifi, the router strips the WiFi header and adds an ethernet header to send it to the server.


### Disadvantages of Layering

- **Inefficiency** - Each layer adds overhead to the message. This is especially true for small messages, since the amount of overhead relative to the message size is large.
- **Hides information** - Each layer hides information from the layer above it. This can make debugging difficult, and limits some applications of the network (like an app that wants to know the network latency, or a network that needs to know about app priorities like QoS).

## OSI Layers


### Application Layer

Services that are used with end user applications. Examples: HTTP, FTP, SMTP, POP3, IMAP, DNS, DHCP, etc.

### Presentation Layer

Formats the data so it can be understood by the application layer. Also handles encryption and compression. Examples: JPEG, MPEG, ASCII, etc.

### Session Layer

Manages the connection between two nodes. Examples: NetBIOS, PPTP, etc.

### Transport Layer

Responsible for the transport protocol and error handling. Examples: TCP, UDP, etc.

### Network Layer

Responsible for routing and addressing. Reads the IP address from a packet. Examples: Routers, Layer 3 switches, etc.

### Data Link Layer

Responsible for the physical addressing. Reads the MAC address from a data packet/frame. Examples: Switches, bridges, etc.

### Physical Layer

Transfer data on a physical medium. Examples: Hubs, NICS, Cables, etc.


## The actual Internet Protocol Stack

```
+-------------+---------------+
| Application | SMTP, HTTP, |
| | RTP, DNS |
+-------------+---------------+
| Transport | TCP, UDP |
+-------------+---------------+
| Internet | IP |
+-------------+---------------+
| Link | Ethernet, DSL,|
| | 3G/4G, WiFi, |
+-------------+---------------+
```

## Course Reference Model

- **Application**: Programs that use network services
- **Transport**: Provides end-to-end data delivery
- **Network**: Provides data delivery across multiple networks
- **Link**: Sends frames over one or more links
- **Physical**: Sends bits using physical signals
---
title: The Physical Layer
category: Hardware
tags: dsp, modulation, coding, noise immunity, clock recovery
description: Describes the hardware component responsible for transmitting and receiving data in a communication system. It focuses on coding, modulation techniques, noise immunity, and clock recovery to ensure reliable data transfer. Key concepts include message latency, cut-through routing, and the differences between modulation and coding methods.
---

# The Physical Layer

**Scope**: How signals are used to transfer bits over a link. i.e, how analog signals are converted to digital signals, and vise versa.

## Coding and Modulation

A modem (modulator-demodulator) converts digital signals to analog signals, and vise versa.

### A simple coding

A high positive voltage for 1, and a low negative voltage for 0. This is called **NRZ**(Non-Return-to-Zero). Each time interval (**symbol**) is like a sample point.

### Problems?

Only 1 bit/symbol. Can use more than just 2 voltage levels to get more bits/symbol. To get N bits/symbol, need 2^n voltage levels. There is a tradeoff between encoding efficiency and the sensitivity to noise.

There are many other practical coding schemes, all of which are driven by engineering considerations.

### Clock Recovery

Reciever needs requent signal transitions to decode bits. Several possible designs, including Manchester Coding and Scrambling.

A simple solution is to alternate between positive/negative, and zero voltages. This is return to zero (RZ) coding.

```txt
0 1 1 1 0
+V | ___ ___ ___
| | | | | | | | | |
| | | | | | | | | |
0 | |___| |___| |___| |___| |
| | | | | | | | | |
| | | | | | | | | |
-V |___| | | | | | | |___|
```

#### Better Solution

- Can map arbitrary bit patterns to eachother (as long as you don't decrease the number of bits to decode). Design encoding such that long runs of zero can't happen
- Can even use xor and a psuedorandom bit pattern to encode and decode to make the encoded data random looking as well, getting rid of most long runs of zero.

### Modulation vs. Coding

In order to agree on the timing of data streams, AKA the start and end of a symbol being transmitted, you need to have a common clock between the two systems that are communicating.

With **coding**, signal is sent directly on a wire. This doesn't work well for wireless, so we use **modulation**. **Modulation** carries a signal by varying the frequency, amplitude, or phase of a carrier wave. *Baseband* is the original signal, and *passband* is the modulated signal. We can modulate a signal by varying the amplitude, frequency, or phase of a carrier wave.

#### Some examples:
- NRZ signal of bits
- Amplitude shift keying (zigbee)
- Frequency shift keying (bluetooth)
- Phase shift keying

WiFi for example goes all in and listens on an entire band of frequencies instead of just the binary 2 frequencies.Modern WiFi uses 256 frequency levels.

### Key Points

- Everythign is analog, even digital signals.
- Digital signals are conceptually discrete, but are represented physically in a continuous medium.
- Modulating and demodulating a signal is converting between analog to digital, and vise versa.
- A coding is an agreed upon "language" for your data.

## Simple Link Model

Two main parameters:

- **Rate** (bandwidth, capacity, speed): Number of bits per second
- **Delay**: Related to the time it takes to deliver a message

Additional info:

- **type of cast**: unicast, multicast, broadcast
- **error rate**

### Message Latency

**Latency** is the time it takes for a message to travel from one end of a link to the other. It is the sum of the **transmission delay** (time to put bits on wire) and the **propagation delay** (time for bits to travel from one end of the link to the other).

```txt
Transimission Delay:
T (delay) = L (message length) / R (rate) = L/R seconds

Propagation Delay:
P (delay) = D (distance) / S (speed) = D/(2/3 * C) = 3D/2C seconds

Total Latency:
L_t = T + P = L/R + 3D/2C
```

#### Example

```txt
Broadband cross-country link:
P = 50ms, R = 10Mbps, L = 1MB

L_t = 1MB/10MBps + 50ms = .1s + .05s = .15s
```


### Cut Through Routing








---
title: Performance
category: Networks
tags: bandwidth, throughput, latency, delay, networks
description: Covers the implementation of performance characteristics in computer networks, including bandwidth, throughput, latency, and delay. Discusses the key factors that influence network performance and how to measure and optimize these metrics.
---

# Performance


Measured in **bandwidth** (or *throughput*) and **latency** (or *delay*).

**Bandwidth:** the number of bits per second
---
title: Information Theory in Networks
category: Networks
tags: information theory, nyquist limit, shannon capacity, bandwidth, signal, noise
description: Describes the fundamental concepts of information theory in the context of networks. It covers key channel properties, the Nyquist limit, and Shannon capacity, and discusses the wired and wireless perspectives of information theory.
---

## Key Channel Properties

- **Bandwidth (B)**: The range of frequencies that can be transmitted over a channel.
- **Signal (S)**: The signal is the information that is being transmitted over the channel.
- **Noise (N)**: The noise is the unwanted information that is being transmitted over the channel.

## Nyquist Limit

Maximum *symbol* rate is 2B symbols/sec.

If there are V signal levels, max bit rate is:

R = 2B log_2(V) bits/sec

## Shannon Capacity

**Capacity (C)** limit is the maximum **lossless** information carrying rate of a channel.

C = B log_2(1 + S/N) bits/sec

- There is some rate at which we can transmit information over a channel without error.
- Assuming noise is fixed, we can increase the bandwidth to increase the capacity, albeit with diminishing returns.
- Increasing bandwidth increases capacity linearly

**Can't beat the Shannon limit**


## Wired/Wireless Perspecitive

Model:
Networks are composed of various components, including hosts, routers, links, and applications. These components work together to enable communication between different devices and systems.
A host is a computer or device that is connected to a network. Examples of hosts include desktop computers, laptops, smartphones, and tablets.
A router is a device that is used to connect two or more networks. It is responsible for forwarding data packets between different networks. Routers can be hardware-based or software-based.
A link is a physical connection that is used to connect two or more hosts or routers. Links can be wired or wireless. Wired links are typically used for long-distance communication, while wireless links are used for short-range communication.
Applications are programs that are used to interact with the network. Examples of applications include web browsers, email clients, and file-sharing programs.
A graph is a mathematical structure that represents the connections between objects or entities. In the context of computer networks, a graph can be used to represent the connections between hosts, routers, and links.
A path in a graph is a sequence of vertices that are connected by edges. A cycle in a graph is a path that starts and ends at the same vertex.
Breadth First Search (BFS) is a graph traversal algorithm that starts at

You:
---
title: Paxos Introduction
category: Distributed Systems
tags: paxos, consensus algorithm, distributed systems, asynchronous systems, state machine replication
description: Explains the Paxos consensus algorithm for ensuring consistency in a distributed system.
---

# Paxos Introduction

## FLP Impossibility Result

It's impossible for a deterministic protocol to guarantee consensus in bounded time in an asynchronous distributed system. The progress and safety of a system are at odds with each other.

Paxos makes the decision to always be safe, and is able to make progress and avoid blocking as long as the majority of nodes are up and there aren't further failures.

## State Machine Replication

Order events/operations into an append-only log. Consensus is easy if only one client request is handled at a time.

Select a leader for clients to send requests to, and define the ordering at that leader. If any leader fails or is slow, elect a new leader (can keep doing this repeatedly). Then, each leader proposes a value that all nodes should agree on.

Leader election is where Paxos comes in.

## Paxos, the algorithm

```plaintext
Proposer:
Prepare(n) -> Promise(n, n', v')
Accept(n, v) -> Accepted(n, v)

Acceptor:
Promise(n, n', v') -> Prepare(n)
Accepted(n, v) -> Accept(n, v)
```

### Phase 1: Prepare

- Proposer selects a proposal number $n$ and sends `Prepare(n)` to all (or a majority) of acceptors.
- Acceptors respond with `Promise(n, n', v')` where $n'$ is the highest proposal number it has accepted, and $v'$ is the value associated with that proposal number.
- If $n > n'$, the acceptor promises not to accept any proposal with a number less than $n$.
- Proposer must wait for a majority of responses before proceeding.

### Phase 2: Accept

- If the proposer receives a majority of promises, it sends `Accept(n_max, v_max)` to all acceptors (the maximal value received in reply).
- Each acceptor that is able to accept the proposal responds with `Accepted(n_max, v_max)`.
- If a majority of acceptors respond, the proposal is chosen.

---
title: Paxos Protocol
category: Distributed Systems
tags: Consensus Algorithm, Distributed Systems, Fault-Tolerant Systems
description: A protocol for achieving consensus in distributed systems
---

# Paxos Made Simple

[reading](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf)

## The Consensus Algorithm

### The Problem

Consider a set of processes that can propose values. A consensus algorithm ensures that a single value is chosen and agreed upon. For safety, we must have...

- Only proposed values are chosen
- Only a single value is chosen
- Processes only learn values that are actually chosen

And it assumes an asynchronous, non-byzantine network in which nodes are fail-stop.

### Choosing a Value

In paxos there are 3 types of agents

- *proposers*
- *acceptors*
- *learners*

#### P1: An acceptor must accept the first proposal it receives

This guarantees that some value is accepted by each node that is proposed to, but it doesn't prevent situations where no proposal is accepted by a majority of acceptors.

#### P2: If a proposal with value $v$ is chosen, then every higher-numbered proposal accepted by any acceptor has value $v$

This guarantees that only a single value is chosen, since unique proposal numbers can be used to decide between accepted values.

##### P2a: If a proposal with value $v$ is chosen, then every higher-numbered proposal accepted by any acceptor has value $v$

This is a stronger version of P2 that ensures previous values are not forgotten/overridden.

However, P2a contradicts P1, since if a proposer "wakes up" after having been out of commission, it must accept whatever value is proposed first. We thus strengthen even further to...

##### P2b: If a proposal with value $v$ is chosen, then every higher-numbered proposal issues by any proposer has value $v$

This shifts the burden of remembering and staying consistent with the chosen value to the proposers instead of the acceptors. We then have...

$$
\text{P2b} \to \text{P2a} \to \text{P2}
$$

In order to implement P2b, we must further constrain our algorithm's behavior to...

##### P2c: For any $v$ and $n$, if a proposal with value $v$ and number $n$ is issued, there is a set $S$ consisting of a majority of acceptors such that either (a) no acceptor in $S$ has accepted any proposal numbered less than $n$, or (b) $v$ is the value of the highest-numbered proposal among all proposals numbered less than $n$ accepted by the acceptors in $S$

To satisfy P2b, we must maintain P2c as an invariant. To make sure this invariant holds, proposers proposing a proposal numbered $n$ must learn the highest-numbered proposal with a number less than $n$ that has been accepted by a majority of acceptors, and propose that value if it exists.

#### Proposition Algorithm

1. A proposer chooses a new proposal number $n$ and sends a *prepare* request to each member of some set of acceptors, awaiting a response containing:
- A guarantee that this acceptor will never accept a proposal numbered less than $n$
- The proposal with the highest number less than $n$ that it has accepted, if any.
2. If the proposer receives the requested responses from a majority of acceptors, it issues an *accept* request, which is a proposal with number $n$ and value $v$, where $v$ is the value of the highest-numbered proposal among the responses, or a value of the proposer's choice if no proposals in the responses were received.

#### Acceptor Behavior

Acceptors can only receive *prepare* and *accept* requests, and can ignore any request without compromising safety (but certainly still sacrificing liveness).

##### P1a: An acceptor can accept a proposal numbered $n$ iff it has not responded to a *prepare* request numbered greater than $n$

which implies P1

### Phases

#### Phase 1

- (a) A proposer selects a proposal number $n$ and sends a *prepare* request with number $n$ to a majority of acceptors.
- (b) If an acceptor receives a *prepare* request with number $n$ greater than any it has seen, it responds with a promise not to accept any proposal numbered less than $n$ and the highest-numbered proposal (and corresponding value) it has accepted.

#### Phase 2

- (a) If the proposer receives responses from a majority of acceptors, it sends an *accept* request to each acceptor with the proposal number $n$ and the value $v$ of the highest-numbered proposal among the responses, or a value of its choosing if no proposals were received.
- (b) If an acceptor receives an *accept* request with number $n$ greater than any it has seen, it accepts the proposal and responds to the proposer, unless it has already responded to a *prepare* request with a number greater than $n$.

Note that to increase performance, if an acceptor ignores a *prepare* or *accept* request because it has already received a *prepare* request with a higher number, it should notify the proposer with a *reject* message. This however doesn't change the correctness, and is thus optional.

## Learning a Chosen Value

One option would be for each acceptor to send a message upon accepting a value to all learners, but this requires a whole lot of message passing. Another option is to maintain a set of *distinguished* learners, which after hearing of a majority acceptance, notify all other learners of the accepted value. The larger this set of distinguished learners, the more fault-tolerant the system, but also the more communication required.

Since messages can be dropped, a value can be chosen without any learner finding out. In this case, learners will find out the chosen value only after a new proposal is chosen. Learners can thus determine whether a value was chosen by following the same protocol to issue a new proposal as above.

## Progress

It is entirely possible with the above protocol that multiple proposers indefinitely one-up each other between sending their *propose* and *accept* requests, such that all proposals are ignored. To prevent this, choose and maintain a single *distinguished* proposer, which is the only proposer allowed to issue proposals. If the distinguished proposer fails, a new one can be elected by the acceptors.

By **FLP**, any such leader election system must rely either on randomness, or real-time (i.e. timeouts).

## Implementing a State Machine

Consider a system of clients that issue requests to execute commands on a cluster of single-threaded application servers. Each application server can be thought of as a deterministic state machine, where the ordering of requests to each server **must** be consistent for them to end up in the same state.

To guarantee consistent ordering of commands executed within our cluster, we implement a separate instance of Paxos, where the $i$th instance's chosen value determines the $i$th command executed on all application servers.

During normal operation, a single server is elected to be leader, which acts as the *distinguished* proposer, and is the only server allowed to issue proposals. Clients then send their requests to this leader, which decides the sequence of commands globally. Any given instance of the protocol might fail, but regardless only one command can ever be chosen as the $i$th command to be executed.

For cases where some subsequence of commands are not yet determined, i.e. not chosen yet when a new leader takes over, the new leader issues phase 1 for all such instances (including the infinitely many commands greater than the largest command in our current sequence). Any values received in response are then proposed, but if an instance remains unconstrained (i.e. no value has been accepted), the leader can propose no-ops for the gaps in the sequence of commands before the last accepted command. It must do this before ever executing commands that come after these unconstrained slots.

After doing so, the leader can continue proposing any further commands requested by clients. The leader is allowed to propose command $i + \alpha$ before knowing the chosen command for $i$, meaning it can get up to $\alpha - 1$ commands ahead of itself (in the case where all commands less than $i + \alpha$ were dropped).

Once a leader has finished phase 1 for all commands thus far and afterwards, it only needs to complete phase 2 for each subsequent command requested, which is known to be the minimal algorithm for reaching consensus after phase 1.

To reiterate what was stated previously, in the case where a single leader is not elected, progress is not guaranteed, but safety is.
---
title: Distributed Architectures with Paxos
category: Distributed Systems
tags: paxos, distributed architectures, lease server, bigtable, chubby, zookeeper
description: Explains the use of Paxos in distributed systems and its applications
---

# Distributed Architectures with Paxos

## Overhead of Simple Architectures

Paxos can make progress so long as a majority of nodes are up. For a Paxos group of size $k$, requires a general overhead of $3(k-1) + 2$ messages.

Primary-backup (with a single backup) using a view server has an overhead of $4$ messages to forward requests. It can handle any one failure.

Using a single server has an overhead of $2$ messages to service a request, and cannot handle any failures.

The above demonstrates a clear tradeoff between the overhead of the system and the number of failures that can be tolerated.

## Paxos as a Lease Server

A lease is a time-limited right to do something. They rely on loosely synchronized clocks, and are used to avoid the overhead of Paxos for every operation. A typical lease term is around a few seconds, plus or minus some epsilon to account for clock drift. If a lease holder fails, the system just waits for the lease to expire.

The following workflow is used to implement leases:

1. The lease is granted to the primary
2. Primary serves requests until the lease expires, forwarding to the backup
3. If the primary doesn't renew the lease (i.e. fails), a lease is granted to the next primary

This design pattern is used in BigTable, Chubby, and ZooKeeper. It prevents split brain if the clock drift is within epsilon. We also only need to service reads on the primary, including logic for cache invalidation. Additionally, we can use write ahead logging, and instead of explicitly maintaining a backup, just replace the primary by executing the log on a new primary.
Model:
The topological ordering of a directed acyclic graph (DAG) is a linear ordering of its vertices such that for every directed edge $(u, v) \in E$, vertex $u$ comes before vertex $v$ in the ordering. It is a fundamental concept in graph theory and has numerous applications in computer science and engineering. The topological ordering of a DAG can be found using the topological sort algorithm, which takes as input a DAG and outputs a topological ordering of its vertices.
A key lemma in the study of topological ordering is that the topological ordering of a DAG is unique up to a permutation of its vertices. This means that no two topological orderings of the same DAG are isomorphic, and that it is impossible to determine the topological ordering of a DAG if all its vertices are indistinguishable.
The topological ordering of a DAG can be used to implement a wide range of algorithms and data structures, including those for graph algorithms, graph coloring, and network flow. Additionally, the topological ordering of a DAG can be used to implement distributed systems and algorithms for consensus, fault tolerance, and data consistency.

You:
what is paxos?
Model:
Paxos is a protocol for achieving consensus in distributed systems. It was designed by Leslie Lamport in the 1980s.
The basic idea behind Paxos is to use a protocol to elect a leader in a distributed system, and then have the leader propose a value to all other nodes in the system. Each node in the system then votes to accept or reject the proposal, and the leader then finally accepts the value with the highest number of votes.
One of the key advantages of Paxos is that it is able to tolerate a large number of node failures, as long as a majority of nodes are still up. This makes Paxos an attractive option for systems that need to be highly fault-tolerant.
Paxos has been widely used in a variety of distributed systems, including distributed databases, distributed file systems, and distributed caching systems. It is also used in many practical applications, such as the Google Cluster Manager, Amazon DynamoDB, and Microsoft SQL Server.
One of the key challenges of implementing Paxos is that it requires a leader election protocol to be implemented first. This is because Paxos relies on the leader to propose a value to all other nodes in the system, and the leader must be able to select itself in a fair and efficient manner