import React, { useState, useEffect } from 'react';
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
  const [ isChanging, setIsChanging ] = useState(true);
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
        // Called twice. When change starts and when change stops.
        setIsChanging(!isChanging);
        setData({
          ...state,
          ...data,
        });
        break;
      default:
        break;
      }
    },
  };
  return (
    state.doc === undefined &&
      <div /> ||
      <div>
        { (isChanging || resp.isLoading) &&
          <div className="h-5 text-xs text-gray-400">Compiling...</div> ||
          <div className="h-5 text-xs text-gray-400">Compiled</div>
        }
        <Form state={state} />
      </div>
  );
}

export default View;
