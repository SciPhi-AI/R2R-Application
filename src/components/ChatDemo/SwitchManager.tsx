import { useState, useCallback } from 'react';

interface Switch {
  checked: boolean;
  label: string;
  tooltipText: string;
}

const useSwitchManager = () => {
  const [switches, setSwitches] = useState<Record<string, Switch>>({});

  const initializeSwitch = useCallback(
    (
      id: string,
      initialChecked: boolean,
      label: string,
      tooltipText: string
    ) => {
      setSwitches((prevSwitches) => ({
        ...prevSwitches,
        [id]: { checked: initialChecked, label, tooltipText },
      }));
    },
    []
  );

  const updateSwitch = useCallback((id: string, checked: boolean) => {
    setSwitches((prevSwitches) => ({
      ...prevSwitches,
      [id]: { ...prevSwitches[id], checked },
    }));
  }, []);

  return {
    switches,
    initializeSwitch,
    updateSwitch,
  };
};

export default useSwitchManager;
