import React, { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { compile } from '../swr/fetchers';
//import { Form } from '../components/form-nyt-1';
//import { Form } from '../components/form-nyt-2';
//import { Form } from '../components/form-nyt-3';
import { Form } from '../components/form-pm-basic';

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
  const [ isSaving, setIsSaving ] = useState(true);
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
      case "change":
        setIsSaving(!isSaving);
        setData({
          ...state,
          ...data,
        });
        break;
      }
    },
  };
  return (
    state.doc === undefined &&
      <div /> ||
      <div>
        { (isSaving || resp.isLoading) &&
          <div className="h-5 text-xs text-gray-400">Saving...</div> ||
          <div className="h-5 text-xs text-gray-400">Saved</div>
        }
        <Form state={state} />
      </div>
  );
}

export default View;
