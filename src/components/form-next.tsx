import {
  chainCommands,
  baseKeymap,
  toggleMark,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema, Node } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { liftListItem, splitListItem } from "prosemirror-schema-list";
import {
  Decoration,
  DecorationSet,
  EditorView,
  NodeViewConstructor,
} from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import React, { ForwardedRef, Ref, forwardRef, useState, useCallback, useEffect } from "react";
import {
  NodeViewComponentProps,
  ProseMirror,
  WidgetViewComponentProps,
  reactKeys,
  widget,
} from "@nytimes/react-prosemirror";
import { debounce } from "lodash";

const TestWidget = forwardRef(function TestWidget(
  { widget, pos, ...props }: WidgetViewComponentProps,
  ref: ForwardedRef<HTMLSpanElement>
) {
  return (
    <span
      {...props}
      ref={ref}
      style={{
        display: "block",
        backgroundColor: "blue",
        width: "4px",
        height: "4px",
        position: "absolute",
        transform: "translateX(-2px)",
      }}
    >
      Widget
    </span>
  );
});

const viewPlugin = new Plugin({
  view(view) {
    const coords = view.coordsAtPos(view.state.selection.from);
    const dom = document.createElement("div");
    dom.style.width = "4px";
    dom.style.height = "4px";
    dom.style.position = "absolute";
    dom.style.top = `${coords.top - 2}px`;
    dom.style.left = `${coords.left - 2}px`;
    dom.style.backgroundColor = "blue";
    document.body.appendChild(dom);
    return {
      update(view) {
        const coords = view.coordsAtPos(view.state.selection.from);
        dom.style.top = `${coords.top - 2}px`;
        dom.style.left = `${coords.left - 2}px`;
      },
      destroy() {
        document.body.removeChild(dom);
      },
    };
  },
});

// Need to handle widgets from plugins
// in ReactEditorView; current call to super
// breaks for React widgets
const widgetPlugin = new Plugin({
  props: {
    decorations(state) {
      return DecorationSet.create(state.doc, [
        widget(state.selection.from, TestWidget, {
          side: 0,
          key: "widget-plugin-widget",
        }),
      ]);
    },
  },
  view(view) {
    const coords = view.coordsAtPos(view.state.selection.from);
    const dom = document.createElement("div");
    dom.style.width = "4px";
    dom.style.height = "4px";
    dom.style.position = "absolute";
    dom.style.top = `${coords.top - 2}px`;
    dom.style.left = `${coords.left - 2}px`;
    dom.style.backgroundColor = "blue";
    document.body.appendChild(dom);
    return {
      update(view) {
        const coords = view.coordsAtPos(view.state.selection.from);
        dom.style.top = `${coords.top - 2}px`;
        dom.style.left = `${coords.left - 2}px`;
      },
      destroy() {
        document.body.removeChild(dom);
      },
    };
  },
});

// const plugins = [
//   keymap({
//     ...baseKeymap,
//     "Mod-i": toggleMark(schema.marks.em),
//     "Mod-b": toggleMark(schema.marks.strong),
//   }),
//   viewPlugin,
//   widgetPlugin,
// ];

const debouncedApply = debounce(({ state, type, data }) => {
  state.apply({type, data});
}, 1000, {leading: true, trailing: true});

const defaultSchemaSpec = {
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM() {
        return ["p", 0];
      },
    },
    img: {
      group: "inline",
      inline: true,
      attrs: {
        src: { default: "" },
      },
      toDOM(node) {
        return [
          "img",
          {
            src: node.attrs.src,
          },
        ];
      },
    },
    list: {
      group: "block",
      content: "list_item+",
      toDOM() {
        return ["ul", 0];
      },
    },
    list_item: {
      content: "paragraph+",
      toDOM() {
        return ["li", 0];
      },
    },
    text: { group: "inline" },
  },
  marks: {
    em: {
      toDOM() {
        return ["em", 0];
      },
    },
    strong: {
      toDOM() {
        return ["strong", 0];
      },
    },
  },
};

const buildInitialEditorState = (schema, doc) => EditorState.create({
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
  ],
});

export function Form({ state }) {
  const schemaSpec = state.schemaSpec || defaultSchemaSpec;
  const [ schema ] = useState(new Schema(schemaSpec));
  const [ editorState, setEditorState ] = useState(
    buildInitialEditorState(schema, Node.fromJSON(schema, state.doc))
  );
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
    <ProseMirror
      as={<article />}
      className="ProseMirror"
      state={editorState}
      dispatchTransaction={dispatchTransaction}
    />
  );
}
