import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { liftListItem, splitListItem } from "prosemirror-schema-list";
import { EditorState, Transaction } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useCallback, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  useEditorEffect,
  useEditorState,
  useNodeViews,
  useEditorEventCallback,
  useEditorEventListener,
  ReactNodeViewConstructor,
  react,
} from "@nytimes/react-prosemirror";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    list: { group: "block", content: "list_item+" },
    list_item: { content: "paragraph+", toDOM: () => ["li", 0] },
    text: { group: "inline" },
  },
});

const editorState = EditorState.create({
  doc: schema.topNodeType.create(null, [
    schema.nodes.paragraph.createAndFill()!,
    schema.nodes.list.createAndFill()!,
  ]),
  schema,
  plugins: [
    keymap({
      ...baseKeymap,
      Enter: chainCommands(
        newlineInCode,
        createParagraphNear,
        liftEmptyBlock,
        splitListItem(schema.nodes.list_item),
        splitBlock
      ),
      "Shift-Enter": baseKeymap.Enter,
      "Shift-Tab": liftListItem(schema.nodes.list_item),
    }),
    react(),
  ],
});

function Paragraph({ children }: NodeViewComponentProps) {
  return <p>{children}</p>;
}

function List({ children }: NodeViewComponentProps) {
  return <ul>{children}</ul>;
}

function ListItem({ children }: NodeViewComponentProps) {
  return <li>{children}</li>;
}

const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
  paragraph: () => ({
    component: Paragraph,
    dom: document.createElement("div"),
    contentDOM: document.createElement("span"),
  }),
  list: () => ({
    component: List,
    dom: document.createElement("div"),
    contentDOM: document.createElement("div"),
  }),
  list_item: () => ({
    component: ListItem,
    dom: document.createElement("div"),
    contentDOM: document.createElement("div"),
  }),
};

export function Form() {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [ mount, setMount ] = useState<HTMLDivElement | null>(null);
  const [ state, setState ] = useState(editorState);
  const [ showEditor, setShowEditor ] = useState(false);

  const dispatchTransaction = useCallback(
    (tr: Transaction) => setState((oldState) => oldState.apply(tr)),
    []
  );
  
  useEffect(() => {
    // To avoid SSR of the editor.
    setShowEditor(true);
  }, []);
  
  console.log("Form() showEditor=" + showEditor);

  return (
    showEditor &&
      <main>
        <h1>Graffiticode React ProseMirror Demo</h1>
        <ProseMirror
          mount={mount}
          state={state}
          nodeViews={nodeViews}
          dispatchTransaction={dispatchTransaction}
        >
          <div ref={setMount} />
          {renderNodeViews()}
        </ProseMirror>
      </main> || <div />
  );
}
