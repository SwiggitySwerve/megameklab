# Criticals Tab Rework Plan

## 1. Overview

This document outlines the plan to rewrite the `CriticalsTab` component from scratch to ensure it correctly implements the desired functionality, including drag-and-drop, click-to-place, and removal operations, all while adhering to the game's rules.

## 2. Analysis of MegaMekLab's Criticals Tab

Based on a review of the original MegaMekLab Java code, the key features and interactions of the criticals tab are as follows:

*   **Main View**: The `BMBuildTab` class serves as the main container for the criticals tab, holding both the critical slot diagram (`BMCriticalView`) and the list of unallocated equipment (`BMBuildView`).
*   **Critical Slot Diagram**: The `BMCriticalView` class is responsible for displaying the critical slots for each location of the 'Mech. It uses a custom `JList` component called `BAASBMDropTargetCriticalList` to render the slots and handle drag-and-drop operations.
*   **Drag-and-Drop**: The `BAASBMDropTargetCriticalList` class, in conjunction with `BMCriticalTransferHandler`, manages the drag-and-drop functionality. It allows users to drag equipment from the unallocated list and drop it into a valid critical slot.
*   **Equipment Removal**: Equipment can be removed from a critical slot in two ways:
    1.  **Right-Click Context Menu**: Right-clicking on a critical slot opens a context menu with options to "Remove" or "Delete" the equipment.
    2.  **Middle-Click**: Middle-clicking on a critical slot also removes the equipment.
*   **Automatic Features**: The tab includes several automatic features, such as "Auto-Fill," "Auto-Compact," and "Auto-Sort," which help to streamline the process of allocating critical slots.

## 3. React Implementation Plan

### Phase 1: Core Component Structure and State Management

1.  **Component Boilerplate**: Create a new `CriticalsTab` component with the basic structure, including the main container, the criticals diagram, and the unallocated equipment panel.
2.  **State Management**: Implement a robust state management solution using React hooks (`useState`, `useReducer`, and `useContext`) to manage the state of the criticals tab, including:
    *   The allocation of equipment to critical slots.
    *   The list of unallocated equipment.
    *   The current interaction mode (drag-and-drop or click-to-place).
    *   The state of the automatic features (auto-fill, auto-compact, auto-sort).
3.  **Critical Slot Data**: Create a data structure to represent the critical slots for each location, including information about the equipment placed in each slot, whether the slot is fixed (e.g., actuators, engine), and any other relevant data.

### Phase 2: Drag-and-Drop and Click-to-Place Functionality

1.  **Drag-and-Drop**: Implement the drag-and-drop functionality using `react-dnd`, as described in my previous plan. This will include:
    *   Making the unallocated equipment items draggable.
    *   Making the critical slots drop targets.
    *   Implementing the necessary logic to handle the drop event and update the state accordingly.
2.  **Click-to-Place**: Add the click-to-place functionality, allowing users to select a piece of equipment from the unallocated list and then click on a critical slot to place it.
3.  **Equipment Removal**: Implement the equipment removal functionality, allowing users to remove equipment from a critical slot by:
    *   Right-clicking on the slot to open a context menu with a "Remove" option.
    *   Middle-clicking on the slot.

### Phase 3: Advanced Features and UI Enhancements

1.  **Automatic Features**: Implement the "Auto-Fill," "Auto-Compact," and "Auto-Sort" features, creating the necessary algorithms to perform these operations.
2.  **Visual Feedback**: Provide clear visual feedback to the user, including:
    *   Highlighting valid drop targets.
    *   Indicating when a drop is not allowed.
    *   Displaying a drag preview of the equipment being dragged.
3.  **UI Polish**: Polish the UI to ensure that it is clean, intuitive, and consistent with the rest of the application.

This plan will allow me to create a new `CriticalsTab` component that is a faithful and improved implementation of the original MegaMekLab functionality.
