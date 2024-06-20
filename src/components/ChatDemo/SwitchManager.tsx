import { useState, useCallback } from "react";

const useSwitchManager = () => {
  const [switches, setSwitches] = useState({});

  const initializeSwitch = useCallback((id, initialChecked, label, tooltipText) => {
    setSwitches((prevSwitches) => ({
      ...prevSwitches,
      [id]: { checked: initialChecked, label, tooltipText },
    }));
  }, []);

  const updateSwitch = useCallback((id, checked) => {
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
