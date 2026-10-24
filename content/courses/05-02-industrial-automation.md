---
slug: industrial-automation
title: Industrial Automation — PLC, SCADA, Modbus and OPC UA
track: automation
order: 2
group: Industrial Automation
icon: PLC
color: #e8590c
summary: Automation pyramid and Purdue model, sensors and actuators, signals (digital, 4–20 mA), PLC hardware and scan cycle, IEC 61131-3 ladder logic and structured text, timers and counters, PID control, HMI/SCADA/DCS, historians, fieldbuses and industrial Ethernet, Modbus RTU/TCP, OPC UA, connecting plant data to .NET, safety and OT security (IEC 62443), with interview questions.
---

# Overview

**Industrial automation** uses control systems — PLCs, DCS, SCADA, robots — to run machines and processes with little human intervention. It is the **OT (Operational Technology)** side of a factory, as opposed to **IT** (ERP, email, business apps). Industry 4.0 is largely about connecting the two.

**Automation pyramid / Purdue model (ISA-95 levels):**

| Level | What lives there | Examples |
|---|---|---|
| 4 — Business | ERP, planning, logistics | SAP, Oracle, Dynamics 365 |
| 3 — Manufacturing operations | MES, quality, scheduling, historian | MES, AVEVA PI, Ignition MES |
| 2 — Supervisory control | SCADA, HMI, engineering stations | WinCC, FactoryTalk View, Ignition, AVEVA InTouch |
| 1 — Control | PLC, DCS controllers, drives, robot controllers | Siemens S7-1500, Allen-Bradley ControlLogix |
| 0 — Field / process | Sensors, actuators, motors, valves | Proximity sensors, RTDs, VFDs, solenoid valves |

Typical industries: automotive, pharma, food & beverage, oil & gas, power, water, semiconductors, packaging.

# Versions

| Year | Milestone |
|---|---|
| 1968–1969 | First PLC (Modicon 084, Dick Morley) built for General Motors to replace relay panels |
| 1979 | Modbus protocol published by Modicon |
| 1980s | DCS and SCADA spread; Profibus (1989) |
| 1993 | IEC 61131-3 standardises PLC languages (3rd edition 2013) |
| 1996 | OPC (OLE for Process Control, Windows DCOM-based) — OPC DA |
| 1999 | Modbus TCP; Modbus later handed to Modbus Organization (2004) |
| 2003 | PROFINET; EtherNet/IP (2001) |
| 2006–2008 | OPC UA released (platform-independent, secure; IEC 62541) |
| 2009+ | ISA/IEC 62443 series for industrial cybersecurity |
| 2010 | Stuxnet attack on Siemens PLCs — OT security becomes mainstream |
| 2018+ | OPC UA over TSN, OPC UA PubSub/MQTT; companion specifications |
| 2020s | Software-defined/virtual PLCs, IEC 61499 distributed control, IT/OT convergence |

# Lifecycle

**How a PLC runs (scan cycle), repeated every few milliseconds:**

1. **Read inputs** — copy the state of all input modules into the input image table.
2. **Execute the program** — evaluate ladder/ST logic from top to bottom using the image.
3. **Write outputs** — copy the output image to output modules (motors, valves).
4. **Housekeeping** — communications, diagnostics; then repeat. Scan time is typically 1–50 ms.

**Automation project lifecycle:** requirements & URS → functional design spec (FDS) → I/O list and electrical design → panel build → PLC/HMI programming → **FAT** (Factory Acceptance Test at the vendor) → installation → **SAT** (Site Acceptance Test) → commissioning → validation (IQ/OQ/PQ in pharma) → maintenance and change management.

# Tools

- **PLC programming:** Siemens TIA Portal (S7-1200/1500), Rockwell Studio 5000 (ControlLogix/CompactLogix), CODESYS (many vendors), Mitsubishi GX Works, Schneider EcoStruxure Control Expert, Omron Sysmac Studio, Beckhoff TwinCAT.
- **HMI/SCADA:** Siemens WinCC (Unified), Rockwell FactoryTalk View, Ignition (Inductive Automation), AVEVA (Wonderware) InTouch/System Platform, GE CIMPLICITY.
- **Historians:** AVEVA PI System (formerly OSIsoft PI), Ignition historian, InfluxDB, Canary.
- **Protocol tools:** Modbus Poll/Slave, UaExpert (OPC UA client), Wireshark, Kepware KEPServerEX (driver/OPC server).
- **.NET libraries:** OPC Foundation UA .NET Standard stack, NModbus / FluentModbus, S7.Net / Sharp7 (Siemens), libplctag (Rockwell), MQTTnet.
- **Simulation:** PLCSIM (Siemens), Factory I/O, digital twins.

# Module: Field Devices and Signals

## Lesson: [Basic|High] Sensors, actuators and signal types

**Sensors (inputs):**

| Sensor | Measures / detects | Output |
|---|---|---|
| Inductive proximity | Metal object present | Digital (PNP/NPN) |
| Capacitive proximity | Any material (level in tank) | Digital |
| Photoelectric | Object breaks light beam | Digital |
| Limit switch | Mechanical position | Digital |
| RTD (PT100) / thermocouple | Temperature | Analog |
| Pressure / level / flow transmitter | Process values | Analog 4–20 mA, HART, fieldbus |
| Encoder | Speed / position | Pulses (high-speed counter) |

**Actuators (outputs):** contactors and motors, **VFD** (variable frequency drive — controls AC motor speed), solenoid valves, pneumatic cylinders, control valves, servo drives, indicator lamps, buzzers.

**Signal types:**

| Type | Range | Notes |
|---|---|---|
| Digital (discrete) | 24 V DC on/off | PNP (sourcing) vs NPN (sinking) sensors |
| Analog current | **4–20 mA** | 4 mA = 0 %, 20 mA = 100 %; < ~3.8 mA means broken wire ("live zero"); immune to voltage drop on long cables |
| Analog voltage | 0–10 V | Simple, but affected by cable length/noise |
| Pulse | kHz | Flow meters, encoders |

**Scaling** an analog value: `value = (raw − rawMin) / (rawMax − rawMin) × (engMax − engMin) + engMin`. Example: a Siemens analog input gives 0–27648 for 4–20 mA; a 0–10 bar transmitter reading 13824 → 5 bar.

## Lesson: [Basic|High] PLC hardware and how a PLC differs from a PC

A **PLC (Programmable Logic Controller)** is a rugged industrial computer: CPU, power supply, digital/analog I/O modules, communication modules, often in a rack or as a compact unit.

| | PLC | PC |
|---|---|---|
| Environment | Heat, vibration, electrical noise, 24/7 for decades | Office conditions |
| Timing | Deterministic scan cycle (real-time) | Non-deterministic OS scheduling |
| I/O | Built for direct sensor/actuator wiring | Needs extra hardware |
| Programming | IEC 61131-3 languages | Any language |
| Reliability | Very high, hot-swap modules, redundancy options | Lower |

Related controllers: **DCS** (Distributed Control System — plant-wide continuous processes such as refineries, tightly integrated with its own HMI, e.g. Emerson DeltaV, ABB 800xA, Honeywell Experion); **PAC** (programmable automation controller — PLC + PC features); **RTU** (remote terminal unit for remote sites like pipelines); **safety PLC** (SIL-rated, e.g. Siemens F-CPU, GuardLogix); **soft/virtual PLC** running on industrial PCs.

# Module: PLC Programming

## Lesson: [Intermediate|High] IEC 61131-3 languages and ladder logic basics

| Language | Style | Best for |
|---|---|---|
| **LD** — Ladder Diagram | Graphical relay logic | Discrete on/off logic, electricians can read it |
| **FBD** — Function Block Diagram | Graphical blocks | Process control, signal flow |
| **ST** — Structured Text | Pascal-like text | Calculations, loops, data handling |
| **SFC** — Sequential Function Chart | Steps and transitions | Sequences (batch, machine cycles) |
| IL — Instruction List | Assembly-like | Deprecated in the 3rd edition (2013) |

**Classic start/stop (seal-in) circuit:**

```text
 |  Start      Stop       Overload          Motor  |
 |---| |---+---|/|--------|/|---------------( )----|
 |         |                                       |
 |  Motor  |                                       |
 |---| |---+                                       |
```

- `| |` normally open contact (true when the bit is 1), `|/|` normally closed contact (true when the bit is 0), `( )` output coil.
- Pressing **Start** energises **Motor**; the parallel **Motor** contact "seals in" so it stays on after Start is released; **Stop** (wired NC in the field for fail-safety) breaks the rung.

Same logic in Structured Text:

```pascal
Motor := (Start OR Motor) AND NOT Stop AND NOT Overload;
```

Other instructions: set/reset (latch/unlatch), rising/falling edge (`R_TRIG`, `F_TRIG`), compare, move, math, jump/subroutine calls.

## Lesson: [Intermediate|High] Timers, counters and sequences

```pascal
// Structured Text (IEC 61131-3)
VAR
  tStartDelay : TON;     // on-delay timer
  ctParts     : CTU;     // up counter
  rtSensor    : R_TRIG;  // rising edge detector
END_VAR

tStartDelay(IN := StartRequest, PT := T#5S);
ConveyorRun := tStartDelay.Q;               // runs 5 s after the request

rtSensor(CLK := PartSensor);
ctParts(CU := rtSensor.Q, RESET := ResetCount, PV := 100);
BoxFull := ctParts.Q;                        // true after 100 parts
```

| Block | Behaviour |
|---|---|
| `TON` | Output turns ON after input has been ON for preset time |
| `TOF` | Output stays ON for preset time after input turns OFF |
| `TP` | Fixed-length pulse |
| `CTU` / `CTD` / `CTUD` | Count up / down / both to a preset |

**Sequences** — use a state machine (SFC, or a `CASE` on a step number in ST): Idle → Fill → Heat → Mix → Drain → Idle, each step with entry conditions, timeouts and fault handling. Avoid scattering sequence logic across many unrelated rungs.

## Lesson: [Intermediate|Medium] PID control loops

**Closed-loop control:** measure the **process variable (PV)**, compare with the **setpoint (SP)**, and adjust the **output (CV/MV)** to reduce the error.

```text
SP ──►(+)──error──► PID ──CV──► valve/heater ──► process ──► PV
       ▲(−)                                                │
       └──────────────────── sensor ◄───────────────────────┘
```

| Term | Effect |
|---|---|
| P — proportional | Output proportional to current error; too high → oscillation; alone leaves steady-state offset |
| I — integral | Accumulates past error; removes offset; too much → overshoot, windup |
| D — derivative | Reacts to rate of change; damps overshoot; sensitive to noise |

Practicalities: anti-windup, bumpless transfer between manual and auto, output limits, filtering noisy signals, tuning methods (Ziegler–Nichols, step-response, auto-tune in the PLC). Examples: temperature of an oven, tank level, pressure, motor speed.

# Module: Supervisory Systems and Communication

## Lesson: [Intermediate|High] HMI, SCADA, alarms and historians

- **HMI (Human-Machine Interface)** — operator screen for one machine or line: start/stop, setpoints, status, alarms.
- **SCADA (Supervisory Control and Data Acquisition)** — supervises many PLCs/RTUs across a plant or region (pipelines, water networks): data collection, control, alarms, trends, reports, often redundant servers.
- **Alarm management** (ISA-18.2): priorities, acknowledgement, shelving, avoid alarm floods; every alarm must require an operator action.
- **Historian** — time-series database storing tag values (temperatures, states) with compression for years; used for trends, OEE, investigations, batch reports.
- **High-performance HMI** (ISA-101): grey backgrounds, colour only for abnormal states, clear hierarchy of screens.

**Tag** = named data point (e.g. `Line1.Filler.Motor.Running`, `Tank3.Level.PV`) with type, address, scaling, alarms and history settings.

## Lesson: [Intermediate|High] Industrial networks and Modbus

| Network | Type | Common with |
|---|---|---|
| Modbus RTU | Serial (RS-485), master/slave | Meters, drives, simple devices |
| Modbus TCP | Ethernet, client/server, port 502 | Everywhere — simplest Ethernet protocol |
| PROFIBUS DP | Fieldbus (RS-485) | Siemens installations |
| PROFINET | Industrial Ethernet, real-time | Siemens |
| EtherNet/IP (CIP) | Industrial Ethernet | Rockwell / Allen-Bradley |
| EtherCAT | Very fast Ethernet fieldbus | Motion control, Beckhoff |
| CAN / CANopen, DeviceNet | Fieldbus | Machines, vehicles |
| IO-Link | Point-to-point smart sensor link | Sensor diagnostics and parameters |
| HART | Digital signal over 4–20 mA | Process instruments |

**Modbus data model:**

| Table | Access | Function codes |
|---|---|---|
| Coils (0xxxx) — 1 bit | Read/write | FC01 read, FC05 write single, FC15 write multiple |
| Discrete inputs (1xxxx) — 1 bit | Read-only | FC02 |
| Input registers (3xxxx) — 16 bit | Read-only | FC04 |
| Holding registers (4xxxx) — 16 bit | Read/write | FC03 read, FC06 write single, FC16 write multiple |

32-bit floats use **two registers** — check the word/byte order (big-endian vs "word swapped") in the device manual. Modbus has **no authentication or encryption** — keep it on isolated networks.

## Lesson: [Advanced|High] OPC UA — the standard for IT/OT data exchange

**OPC UA (Unified Architecture, IEC 62541)** is a platform-independent, secure, service-oriented standard for industrial data exchange — the successor of classic OPC DA, which depended on Windows DCOM.

| Feature | Meaning |
|---|---|
| Information model | Address space of **nodes** (objects, variables, methods) with types and references — data has meaning, not just addresses |
| Services | Browse, Read, Write, **Subscribe** (monitored items notify on change), Call methods, history read, alarms & conditions |
| Security | X.509 certificates, signing and encryption, user authentication (username, certificate, token) |
| Transports | Binary over TCP (`opc.tcp://host:4840`), HTTPS; **PubSub** over UDP/MQTT for one-to-many |
| Companion specifications | Standard models per industry/machine type (PackML, Robotics, Machine Tools/umati, Euromap for plastics) |

Many PLCs (Siemens S7-1500, Beckhoff, B&R, CODESYS) include an OPC UA server; gateways such as Kepware expose older protocols as OPC UA.

## Lesson: [Advanced|High] Connecting PLCs to .NET applications

**Read a Modbus TCP register with NModbus:**

```csharp
using System.Net.Sockets;
using NModbus;

using var tcp = new TcpClient("192.168.0.10", 502);
var master = new ModbusFactory().CreateMaster(tcp);
ushort[] regs = master.ReadHoldingRegisters(slaveAddress: 1, startAddress: 0, numberOfPoints: 2);
float temperature = BitConverter.ToSingle(BitConverter.GetBytes((regs[0] << 16) | regs[1]), 0);  // word order per device manual
master.WriteSingleRegister(1, 10, 750);   // write setpoint 75.0 (scaled ×10)
```

**Subscribe to OPC UA values with the OPC Foundation .NET stack (simplified):**

```csharp
var endpoint = CoreClientUtils.SelectEndpoint(config, "opc.tcp://plc1:4840", useSecurity: true);
using var session = await Session.Create(config, new ConfiguredEndpoint(null, endpoint), false, "MES", 60000, new UserIdentity(), null);

var subscription = new Subscription(session.DefaultSubscription) { PublishingInterval = 1000 };
var item = new MonitoredItem(subscription.DefaultItem) { StartNodeId = "ns=3;s=\"Line1\".\"Temperature\"", SamplingInterval = 500 };
item.Notification += (mi, e) =>
{
    foreach (var value in mi.DequeueValues())
        Console.WriteLine($"{mi.StartNodeId} = {value.Value} ({value.StatusCode}) @ {value.SourceTimestamp}");
};
subscription.AddItem(item);
session.AddSubscription(subscription);
subscription.Create();
```

**Architecture for a plant-data application:**

```text
PLCs (Modbus/S7/EtherNet/IP) ─► Gateway / OPC UA server ─► Edge service (.NET Worker, buffering)
     ─► MQTT broker or Azure IoT Hub ─► Stream processing ─► SQL Server / time-series DB ─► Dashboards, MES, ML
```

Design rules: **read-mostly** (writes to PLCs only through controlled, audited paths with interlocks staying in the PLC), buffer data at the edge when the network drops (store-and-forward), use source timestamps and status/quality codes, keep OT networks segmented.

# Module: Safety and Security

## Lesson: [Advanced|Medium] Functional safety and OT cybersecurity

**Functional safety** — protecting people and equipment when something fails:

- Standards: IEC 61508 (general), IEC 61511 (process industry SIS), ISO 13849 / IEC 62061 (machinery).
- **SIL** (Safety Integrity Level 1–4) / **PL** (Performance Level a–e) express required risk reduction.
- Emergency stop circuits are hard-wired or on safety PLCs; standard PLC logic must never be the only protection.
- Fail-safe design: stop buttons wired normally-closed, outputs de-energise to a safe state, watchdogs.

**OT cybersecurity:**

| Principle | Practice |
|---|---|
| Segmentation | Zones and conduits (IEC 62443), firewalls between levels, an industrial DMZ between IT and OT |
| Least privilege | Role-based access to engineering tools and HMIs; no shared admin passwords |
| Secure protocols | OPC UA with security; avoid exposing Modbus/S7 to IT or the internet |
| Patch & asset management | Inventory of PLC firmware/versions; patch in maintenance windows |
| Monitoring | OT intrusion detection (Nozomi, Claroty, Dragos); log engineering changes |
| Remote access | Through secured jump hosts/VPN with MFA, time-limited, recorded |

Real incidents: Stuxnet (2010, centrifuge PLCs), Ukraine power grid (2015/2016), Triton/Trisis (2017, targeted safety systems), Colonial Pipeline (2021, IT ransomware that forced OT shutdown).

# Interview

## [Beginner|High] What is a PLC and how is it different from a microcontroller or PC?

A PLC is a rugged industrial controller that reads inputs, runs a control program in a deterministic scan cycle and drives outputs. Compared to a PC it is built for harsh environments, real-time deterministic timing, direct industrial I/O and decades of 24/7 operation, programmed in IEC 61131-3 languages. A microcontroller is a chip that needs custom boards, protection and certification to do the same job.

## [Beginner|High] Explain the PLC scan cycle.

Read all inputs into the input image table → execute the program top to bottom using that image → write the output image to the physical outputs → do communication and diagnostics → repeat. Scan time is usually milliseconds. Because inputs are sampled once per scan, very short pulses need high-speed inputs or interrupts.

## [Beginner|High] What are the IEC 61131-3 programming languages?

Ladder Diagram (relay-style graphics), Function Block Diagram (blocks connected by signals), Structured Text (high-level text like Pascal), Sequential Function Chart (steps and transitions for sequences), and Instruction List (assembly-like, deprecated since the 2013 edition). Ladder for discrete logic, ST for maths and data, SFC for sequences, FBD for process control.

## [Beginner|High] What is the difference between SCADA, HMI and DCS?

HMI is the operator interface for a machine or line. SCADA supervises many controllers over a plant or wide area — data acquisition, control, alarms, trends and reporting. A DCS is an integrated control system (controllers + HMI + engineering) for continuous processes like refineries and power plants, where control is distributed across controllers on a common platform.

## [Beginner|High] Why is 4–20 mA used instead of 0–20 mA or 0–10 V?

Current signals are not affected by voltage drop over long cables and are less sensitive to electrical noise. The "live zero" at 4 mA lets you detect a broken wire (current near 0 mA) as a fault rather than reading it as 0 %, and the 4 mA can power two-wire loop-powered transmitters.

## [Beginner|Medium] What is the difference between NO and NC contacts, and why is a stop button wired NC?

Normally open contacts close when actuated; normally closed contacts open when actuated. Stop and emergency-stop buttons are wired NC so a broken wire or loose terminal has the same effect as pressing Stop — the machine fails safe instead of becoming impossible to stop.

## [Intermediate|High] Explain the start/stop seal-in (latching) circuit.

Start (NO) in parallel with a contact of the motor output, in series with Stop (NC in the field) and overload. Pressing Start energises the motor coil; the motor's own contact keeps the rung true after Start is released (seal-in); pressing Stop or an overload breaks the rung. In ST: `Motor := (Start OR Motor) AND NOT Stop AND NOT Overload;`.

## [Intermediate|High] Explain TON, TOF and counters with an example.

TON (on-delay): output becomes true when the input has stayed true for the preset — e.g. start a conveyor 5 s after a horn. TOF (off-delay): output stays true for the preset after the input turns false — e.g. keep a cooling fan running 2 minutes after the motor stops. CTU counts rising edges to a preset — e.g. 100 parts fill a box, then reset.

## [Intermediate|High] What is Modbus? Explain its data model and function codes.

A simple open request/response protocol (RTU over RS-485 serial, TCP over Ethernet on port 502). Data tables: coils (read/write bits — FC01/05/15), discrete inputs (read-only bits — FC02), input registers (read-only 16-bit — FC04) and holding registers (read/write 16-bit — FC03/06/16). 32-bit values span two registers with device-specific word order. It has no security, so it belongs on segmented networks.

## [Intermediate|High] What is OPC UA and why is it important for Industry 4.0?

A vendor- and platform-independent standard (IEC 62541) for secure industrial data exchange. It provides a rich information model (typed objects, not just addresses), services for read/write/subscribe/methods/history/alarms, built-in security with certificates and encryption, and transports from client/server to PubSub over MQTT. It lets MES, cloud and analytics systems read machine data the same way from any vendor.

## [Intermediate|Medium] What is PID control? What do P, I and D do?

A feedback algorithm that adjusts an output to keep a process variable at its setpoint. P reacts to the current error (bigger error → bigger correction), I accumulates past error to remove steady-state offset, D reacts to how fast the error changes to reduce overshoot. Tuning balances speed, overshoot and stability; add anti-windup and output limits.

## [Intermediate|Medium] What is the difference between FAT and SAT?

Factory Acceptance Test: the system (panels, PLC/HMI programs) is tested at the integrator's site, often with simulated I/O, before shipping. Site Acceptance Test: after installation at the plant, with real field devices and process, before handover to production. Both are witnessed and documented against the functional specification.

## [Advanced|High] How would you collect data from 50 PLCs of different brands into a .NET application?

Use a gateway/OPC UA layer to normalise protocols (built-in OPC UA servers, or Kepware/Ignition for S7, EtherNet/IP, Modbus), then a .NET edge service (Worker Service) that subscribes to OPC UA monitored items or polls Modbus, adds source timestamps and quality, buffers locally (store-and-forward) and publishes to MQTT/Azure IoT Hub or writes to a time-series/SQL database. Use a tag configuration table, a consistent naming model (ISA-95 hierarchy), and keep OT and IT networks separated by a DMZ.

## [Advanced|High] How do you secure an OT network?

Defence in depth per IEC 62443: asset inventory, segmentation into zones and conduits with firewalls and an industrial DMZ, no direct internet access to controllers, secure protocols (OPC UA with signing/encryption), strict remote access (jump host, MFA, recording), least-privilege accounts, change control and backups of PLC programs, patching in maintenance windows, OT-aware monitoring, and incident response plans that consider safety.

## [Advanced|Medium] What is the difference between a standard PLC and a safety PLC?

A safety PLC is certified for functional safety (e.g. SIL 3 / PL e): redundant processors and I/O, self-diagnostics, safe communication (PROFIsafe, CIP Safety), and a protected safety program that goes to a safe state on any detected fault. Safety functions (e-stop, light curtains, guard doors, burner management) belong in the safety PLC or hard-wired circuits, never only in standard logic.

## [Scenario|High] A motor sometimes doesn't start when the operator presses Start on the HMI. How do you troubleshoot?

Check the PLC online: is the HMI command bit reaching the PLC (HMI write and tag address), is the command a momentary pulse shorter than the scan or overwritten elsewhere (duplicate coil, another rung/routine), are permissives/interlocks true (stop, overload, guard, upstream conditions), any faults on the drive/VFD, the output module and contactor (output LED, fuse, wiring). Use cross-references and a trend of the involved bits; check the alarm log for the time of failure.

## [Scenario|High] The MES shows wrong temperature values from a Modbus device. What could be wrong?

Wrong register address (0- vs 1-based offset: 40001 is register 0), wrong function code (holding vs input registers), wrong data type or word/byte order for 32-bit floats, missing scaling factor (value ×10), wrong slave/unit id, or reading stale data after a communication error without checking quality. Compare with a tool like Modbus Poll and the device manual.

## [Scenario|Medium] Management wants to let a cloud dashboard write setpoints directly to PLCs. What do you advise?

Treat it as a safety and security risk. Keep control and interlocks in the PLC; allow only bounded, validated setpoint changes through a controlled path (MES/SCADA with role-based access, approval, audit trail, limits enforced again in the PLC); no inbound connections from the internet into OT — use outbound-only edge connections through the DMZ; follow change-management and safety review (MOC). Often a read-only cloud dashboard is the right first step.

# Cheatsheet

## Levels (ISA-95 / Purdue)

0 field devices · 1 PLC/DCS control · 2 SCADA/HMI · 3 MES/historian · 4 ERP. DMZ between 3 and 4.

## PLC basics

Scan: inputs → program → outputs → housekeeping. Languages: LD, FBD, ST, SFC (IL deprecated). Timers TON/TOF/TP; counters CTU/CTD; edges R_TRIG/F_TRIG.

## Signals

Digital 24 V (PNP/NPN) · 4–20 mA (live zero, broken-wire detection) · 0–10 V · scaling `(raw−rMin)/(rMax−rMin)×(eMax−eMin)+eMin`.

## Modbus

Coils FC01/05/15 · discrete inputs FC02 · input registers FC04 · holding registers FC03/06/16 · TCP port 502 · two registers per float — check word order · no security.

## OPC UA

Nodes + information model · read/write/subscribe/methods/history/alarms · certificates + encryption · `opc.tcp://host:4840` · PubSub over MQTT · companion specs.

## Safety & security

E-stop NC and on safety PLC/hard-wired · SIL/PL · IEC 62443 zones & conduits · no internet to PLCs · audited writes only.
