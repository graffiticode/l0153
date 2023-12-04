import React, { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { compile } from '../swr/fetchers';
import { Form } from '../components/form-nyt-1';

function isNonNullObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null
  );
}

const View = (props = {}) => {
  const router = useRouter();
  const { access_token: accessToken, id } = router.query;
  const [ data, setData ] = useState({});
  const resp = useSWR(
    accessToken && id && {
      accessToken,
      id,
      data,
    },
    compile
  );
  const state = {
    ...data,
    ...resp.data,
    apply({ type, data = [] }) {
      // Apply actions to state.
      switch (type) {
      default:
        setData({
          ...state,
          ...data,
        });
        break;
      }
    },
  };
  console.log("View() state=" + JSON.stringify(state, null, 2));
  return (
    state.doc &&
      <Form state={state} /> ||
      <div />
  );
}

export default View;
