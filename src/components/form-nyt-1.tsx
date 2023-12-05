import assert from "assert";
import { Schema, Node } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useState, useEffect } from "react";
import {
  ProseMirror,
} from "@nytimes/react-prosemirror";
import { schema } from "prosemirror-schema-basic";
import { debounce } from "lodash";

const debouncedApply = debounce(({ state, type, data }) => {
  state.apply({type, data});
}, 1000, {leading: true, trailing: true});

export function Form({ state }: { state: any }) {
  const [ mount, setMount ] = useState<HTMLElement | null>(null);
  const [ editorState, setEditorState ] = useState(EditorState.create({
    doc: Node.fromJSON(schema, state.doc),
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

