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
    +-- (Host)      --+
    |                 |
(Link)                |
    |                 |  logical
    +-- (Host)        |    link
    |                 |
(Link)                |
    |                 |
    +-- (Host)      --+
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
X <---------------> X  <- (peers)
^                   ^
| <- (Y service) -> |
|                   |
Y <---------------> Y  <- (peers)
    (comm using Y)
```

#### Examples of protocols:
TCP, UDP, HTTP, FTP, SMTP, POP3, IMAP, DNS, DHCP, ARP, ICMP, IP, Ethernet, WiFi, Bluetooth, USB, FireWire, DSL, cable TV, 3G/4G, etc.

#### Example of a stack
```
 (browser)
    ||
+--------+
| HTTP   |
+--------+
| TCP    |
+--------+
| IP     |
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
| Application | SMTP, HTTP,   |
|             | RTP, DNS      |
+-------------+---------------+
| Transport   | TCP, UDP      |
+-------------+---------------+
| Internet    | IP            |
+-------------+---------------+
| Link        | Ethernet, DSL,|
|             | 3G/4G, WiFi,  |
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
    0       1        1      1       0
+V |        ___     ___     ___
   |   |   |   |   |   |   |   |   |   |
   |   |   |   |   |   |   |   |   |   |
0  |   |___|   |___|   |___|   |___|   |
   |   |   |   |   |   |   |   |   |   |
   |   |   |   |   |   |   |   |   |   |
-V |___|   |   |   |   |   |   |   |___|
```

#### Better Solution

-  Can map arbitrary bit patterns to eachother (as long as you don't decrease the number of bits to decode). Design encoding such that long runs of zero can't happen
-  Can even use xor and a psuedorandom bit pattern to encode and decode to make the encoded data random looking as well, getting rid of most long runs of zero.

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

