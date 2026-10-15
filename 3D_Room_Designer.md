# Interactive 3D Room Designer

## Process

From the user's point of view, the designer works in five steps:

1. **Choose a room.** The user selects a room type (for example, a bedroom) and enters the width, length and wall height.
2. **View the room in 3D.** The room is shown in 3D. The user can turn the view around and zoom in or out.
3. **Add furniture.** The user picks items from a catalogue. Each item is a 3D model of the real product, shown at its real size.
4. **Arrange and style.** The user drags items to move them, rotates them and changes their colour or finish. Items are kept inside the walls.
5. **Save.** The design is saved so it can be reopened later or shared with others.

### 1.1 Internal process: moving an item

When the user drags a piece of furniture, the application repeats the following steps many times per second, so the item follows the pointer smoothly:

1. The application detects the position of the mouse or finger.
2. It calculates which point on the floor is under the pointer.
3. It checks that the item still fits inside the room and flags any overlap with other items.
4. It updates the stored design with the new position.
5. The 3D view and the 2D floor plan are redrawn.

### 1.2 Internal process: saving and reopening a design

The application does not save a picture of the room. Instead, it records a short description of the design: the room size, the wall and floor finishes, and, for each item, the product, its position, its angle and its finish.

1. **Save:** the description is written as a small text file (JSON format), usually only a few kilobytes.
2. **Store:** the file is kept in the browser, or on a server if the design needs to be shared.
3. **Reopen:** the file is read, the room is rebuilt from its measurements, and each item is loaded and placed back in its saved position.

This approach keeps saved designs small and quick to load. Because items are stored by product ID, a product's model or price can change without breaking older designs. The undo and redo feature works in the same way: the application keeps earlier copies of the design and restores them when needed.

## 2. Technology stack

| Component | Technology | Role |
| --- | --- | --- |
| Website and screens | Next.js, React, TypeScript | Builds the pages, panels, buttons and catalogue. |
| Styling | Tailwind CSS | Controls the layout and appearance on desktop and mobile. |
| 3D view | three.js (WebGL) | Draws the room and furniture in 3D in the browser; handles the camera, lighting, shadows and dragging. |
| Furniture models | GLB / glTF files | Stores the 3D model of each product. |
| Model preparation | Blender, glTF-Transform | Blender is used to create and fix models; glTFTransform reduces file size before upload. |
| Floor plan | SVG | Draws the 2D top-down plan with measurements to each wall. |
| Saved designs | JSON, browser storage, database | Stores each design as a small text record; a database allows sharing between devices. |
| File delivery | CDN | Delivers model files and images quickly to users. |
| Product information | Product API | Supplies product names, prices, sizes and stock. |
