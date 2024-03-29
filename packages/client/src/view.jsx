import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Form } from "./components/form";
import { createState } from "./lib/state";
import { compile } from './swr/fetchers';

function isNonNullNonEmptyObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null &&
      Object.keys(obj).length > 0
  );
}

export const View = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const accessToken = params.get("access_token");
  const [ recompile, setRecompile ] = useState(true);
  const [ height, setHeight ] = useState(0);
  useEffect(() => {
    // If `id` changes, then recompile.
    if (id) {
      setRecompile(true);
    }
  }, [id]);

  console.log("View() id=" + id + " accessToken=" + accessToken);
  
  const [ state ] = useState(createState({}, (data, { type, args }) => {
    console.log("state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "compiled":
      return {
        ...data,
        ...args,
      };
    case "change":
      setRecompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  const resp = useSWR(
    recompile && accessToken && id && {
      accessToken,
      id,
      data: state.data,
    },
    compile
  );

  if (resp.data) {    
    state.apply({
      type: "compiled",
      args: resp.data,
    });
    setRecompile(false);
  }

  useEffect(() => {
    window.parent.postMessage({height}, "*");
  }, [height]);

  return (
    isNonNullNonEmptyObject(state.data) &&
      <Form state={state} setHeight={setHeight} /> ||
      <div />
  );
}
