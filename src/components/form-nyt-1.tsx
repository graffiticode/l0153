import assert from "assert";
import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema, DOMParser, Node } from "prosemirror-model";
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

import { schema } from "prosemirror-schema-basic";

// const schema = new Schema({
//   nodes: {
//     doc: { content: "block+" },
//     paragraph: { group: "block", content: "inline*" },
//     list: { group: "block", content: "list_item+" },
//     list_item: { content: "paragraph+", toDOM: () => ["li", 0] },
//     text: { group: "inline" },
//   },
// });

// const initialEditorState = EditorState.create({
//   doc: schema.topNodeType.create(null, [
//     schema.nodes.paragraph.createAndFill()!,
//     schema.nodes.list.createAndFill()!,
//   ]),
//   schema,
//   plugins: [
//     keymap({
//       ...baseKeymap,
//       Enter: chainCommands(
//         newlineInCode,
//         createParagraphNear,
//         liftEmptyBlock,
//         splitListItem(schema.nodes.list_item),
//         splitBlock
//       ),
//       "Shift-Enter": baseKeymap.Enter,
//       "Shift-Tab": liftListItem(schema.nodes.list_item),
//     }),
//     react(),
//   ],
// });

function Paragraph({ children }: NodeViewComponentProps) {
  return <p>{children}</p>;
}

function List({ children }: NodeViewComponentProps) {
  return <ul>{children}</ul>;
}

function ListItem({ children }: NodeViewComponentProps) {
  return <li>{children}</li>;
}

function dataFromContent(ctx, content) {
  let data
  content.forEach((child, offset, index) => {
    const { type, content, text } = child;
    switch(type.name) {
    case "table":
      data = dataFromContent(ctx, content);
      break;
    case "table_row":
      if (index === 0) {
        data = { cols: [].concat(dataFromContent(ctx, content)), ...data };
        ctx = Object.assign(ctx, data);
      } else {
        data.rows = (data.rows || []).concat(dataFromContent(ctx, content));
      }
      break;
    case "table_header":
      if (index === 0) {
        data = [];
      }
      data.push(dataFromContent(ctx, content));
      break;
    case "table_cell":
      data = data || {};
      data[ctx.cols[index]] = dataFromContent(ctx, content);
      break;
    case "paragraph":
      data = dataFromContent(ctx, content);
      break;
    case "text":
      data = text;
      break;
    default:
      break;
    }
  });
  return data;
}

function Editor({ state, reactNodeViews }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [ mount, setMount ] = useState<HTMLDivElement | null>(null);
  const [ editorState, setEditorState ] = useState(initialEditorState);
  const [ showEditor, setShowEditor ] = useState(false);
  const dispatchTransaction = useCallback(
    (tr: Transaction) => {
      setEditorState(oldState => oldState.apply(tr));
      if (mount) {
        const doc = DOMParser.fromSchema(schema).parse(mount);
        state.apply({
          type: "change",
          data: doc.content,
        })
      }
    },
    []
  );

  useEffect(() => {
    // To avoid SSR of the editor.
    setShowEditor(true);
  }, []);
  
  return (
    showEditor &&
      <main>
        <h1>Graffiticode React ProseMirror Demo</h1>
        <ProseMirror
          mount={mount}
          state={editorState}
          nodeViews={nodeViews}
          dispatchTransaction={dispatchTransaction}
        >
          <div ref={setMount} />
          {renderNodeViews()}
        </ProseMirror>
      </main> || <div />
  );
}

export function Form({ state }) {
  assert(state.doc);
  const [ mount, setMount ] = useState<HTMLElement | null>(null);
  const doc = state.doc;
  const [ editorState, setEditorState ] = useState(EditorState.create({
    doc: Node.fromJSON(schema, doc),
  }));
  useEffect(() => {
    state.apply({
      type: "change",
      data: {
        doc: editorState.doc.toJSON()
      },
    });
  }, [editorState]);
  return (
    <ProseMirror
      mount={mount}
      state={editorState}
      dispatchTransaction={
        (tr) => {
          setEditorState(s => s.apply(tr));
        }
      }
    >
      <div ref={setMount} />
    </ProseMirror> ||
      <div />
  );
}

