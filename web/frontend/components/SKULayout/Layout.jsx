import { Text } from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTranslation } from "react-i18next";
import DraggingGif from "../../assets/DraggingGif.gif";

function SkuLayout({ layoutOrder, setLayoutOrder }) {
  const { t } = useTranslation();
  const [showDraggingGif, setShowDraggingGif] = useState(true);

  function handleOnDragEnd(result) {
    setShowDraggingGif(false);
    if (!result.destination) return;

    const items = Array.from(layoutOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLayoutOrder(items);
  }

  return (
    <>
      {showDraggingGif && (
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <img src={DraggingGif} alt="Dragging animation" />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="layoutOrder" direction="horizontal">
            {(provided, snapshot) => (
              <div
                className="layoutOrder"
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={getListStyle(
                  snapshot.isDraggingOver,
                  layoutOrder.length
                )}
              >
                {layoutOrder.map(({ id, name }, index) => {
                  return (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}
                        >
                          <p style={{ color: "#000000" }}>{name}</p>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div style={{ textAlign: "center" }}>
        <Text variation="subdued">
          {t("SkuGenerate.basicRules.layout.helpText")}
        </Text>
      </div>
    </>
  );
}

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: "none",
  padding: grid * 2,
  margin: `0 1px 0 0`,
  borderRadius: "8px",

  // change background colour if dragging
  background: isDragging ? "#BFBFC5" : "#E8E8ED",

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver, itemsLength) => ({
  display: "flex",
  padding: grid,
});

export default SkuLayout;
