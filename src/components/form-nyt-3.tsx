import assert from "assert";
import "prosemirror-view/style/prosemirror.css";
import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema, Node } from "prosemirror-model";
import { liftListItem, splitListItem } from "prosemirror-schema-list";
import { EditorState, Transaction } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useCallback, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ProseMirror,
  useNodeViews,
  useEditorEventCallback,
  react,
  NodeViewComponentProps,
  ReactNodeViewConstructor,
} from "@nytimes/react-prosemirror";

import { debounce } from "lodash";

const debouncedApply = debounce(({ state, type, data }) => {
  state.apply({type, data});
}, 1000, {leading: true, trailing: true});

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    list: { group: "block", content: "list_item+" },
    list_item: { content: "paragraph+", toDOM: () => ["li", 0] },
    text: { group: "inline" },
  },
});

const buildInitialEditorState = doc => EditorState.create({
  // doc: schema.topNodeType.create(null, [
  //   schema.nodes.paragraph.createAndFill()!,
  //   schema.nodes.list.createAndFill()!,
  // ]),
  doc,
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

export function Form({ state }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [editorState, setEditorState] =
        useState(buildInitialEditorState(Node.fromJSON(schema, state.doc)));
  const dispatchTransaction = useCallback(
    (tr: Transaction) => setEditorState((oldState) => oldState.apply(tr)),
    []
  );
  const doc = editorState.doc.toJSON();
  useEffect(() => {
    debouncedApply({
      state,
      type: "change",
      data: {
        doc,
      },
    });
  }, [JSON.stringify(doc)]);
  return (
    <div>
      <h1>React ProseMirror Demo</h1>
      <ProseMirror
        mount={mount}
        state={editorState}
        nodeViews={nodeViews}
        dispatchTransaction={dispatchTransaction}
      >
        <div ref={setMount} />
        {renderNodeViews()}
      </ProseMirror>
    </div>
  );
}
