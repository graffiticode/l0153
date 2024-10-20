import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { createState } from "./lib/state";
import { compile, getData } from './swr/fetchers';
import './index.css';
import { Form } from "./components";
export { Form } from "./components";

function isNonNullNonEmptyObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null &&
      Object.keys(obj).length > 0
  );
}

export const View = () => {
  const [ id, setId ] = useState();
  const [ accessToken, setAccessToken ] = useState();
  const [ doGetData, setDoGetData ] = useState(true);
  const [ recompile, setRecompile ] = useState(false);
  const [ height, setHeight ] = useState(0);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      setId(params.get("id"));
      const accessToken = params.get("access_token");
      setAccessToken(accessToken);
      const data = params.get("data");
      if (data) {
        state.apply({
          type: "init",
          args: JSON.parse(data),
        });
      }
    }
  }, [window.location.search]);

  useEffect(() => {
    // If `id` changes, then recompile.
    if (id) {
      setDoGetData(true);
    }
  }, [id]);

  const [ state ] = useState(createState({}, (data, { type, args }) => {
    console.log("L0153 state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "init":
      return {
        ...args,
      };
    case "compile":
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

  const dataResp = useSWR(
    doGetData && id && {
      accessToken,
      id,
    },
    getData
  );

  if (dataResp.data) {
    state.apply({
      type: "compile",
      args: dataResp.data,
    });
    setDoGetData(false);
  }

  const compileResp = useSWR(
    recompile && accessToken && id && {
      accessToken,
      id,
      data: state.data,
    },
    compile
  );

  if (compileResp.data) {
    state.apply({
      type: "compile",
      args: compileResp.data,
    });
    setRecompile(false);
  }
  return (
    isNonNullNonEmptyObject(state.data) &&
      <Form state={state} />
      || <div />
  );
}
