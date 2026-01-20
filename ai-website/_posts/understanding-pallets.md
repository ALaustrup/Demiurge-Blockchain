---
title: 'Core Concepts: Understanding Pallets'
date: '2024-07-27'
excerpt: 'A pallet is a modular component of the Demiurge runtime that encapsulates a specific piece of business logic. Learn how they work.'
---

One of the most powerful features of Substrate, the framework Demiurge is built on, is its modularity. This modularity is achieved through **pallets**.

## What is a Pallet?

Think of a pallet as a self-contained "module" or "plugin" that provides a specific feature for the blockchain. Each pallet encapsulates its own logic, storage items, and public functions.

For example, the Demiurge runtime is composed of many pallets working together:

-   `pallet-cgt`: Manages the core logic for the Creator God Token (CGT), including transfers and balances.
-   `pallet-qor-identity`: Handles the creation and management of user identities (QOR ID).
-   `pallet-drc369`: Implements the logic for our stateful, programmable NFTs.

This modular design makes the blockchain incredibly flexible and easy to upgrade. New features can be added simply by developing and integrating a new pallet into the runtime.
