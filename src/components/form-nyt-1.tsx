import assert from "assert";
import { Schema, Node } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useState, useEffect } from "react";

import {
  ProseMirror,
} from "@nytimes/react-prosemirror";

import { schema } from "prosemirror-schema-basic";

export function Form({ state }) {
  if (state.doc === undefined) {
    return <div />;
  }
  const { doc } = state;
  const [ mount, setMount ] = useState<HTMLElement | null>(null);
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
    </ProseMirror>
  );
}

