import { useEffect, useRef } from 'react';

import { PLUGIN_ID } from '../pluginId';

type InitializerProps = {
  setPlugin: (id: string) => void;
};

const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = useRef(setPlugin);
    console.log('Initializer mounted for plugin:', PLUGIN_ID);
    console.log('Initializer props:', { setPlugin });
  useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);

  return null;
};

export { Initializer };
