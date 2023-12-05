import assert from "assert";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser, Node } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { exampleSetup } from "prosemirror-example-setup"
import "prosemirror-view/style/prosemirror.css";
import React, { useState, useEffect } from "react";
import {
  ProseMirror,
} from "@nytimes/react-prosemirror";
import { debounce } from "lodash";

const debouncedApply = debounce(({ state, type, data }) => {
  state.apply({type, data});
}, 1000, {leading: true, trailing: true});

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks
})

export function Form({ state }: { state: any }) {
  const [ mount, setMount ] = useState<HTMLElement | null>(null);
  const [ editorState, setEditorState ] = useState(EditorState.create({
    doc: Node.fromJSON(mySchema, state.doc),
    plugins: exampleSetup({schema: mySchema})
  }));
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
      mount={mount}
      state={editorState}
      dispatchTransaction={
        (tr) => {
          setEditorState(s => s.apply(tr));
        }
      }
    >
      <div ref={setMount} />
    </ProseMirror>
  );
}
