import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
  } from 'react';
  import { Step } from 'react-joyride';
  
  /**
   * We'll track Joyride completions by route path.
   * e.g. If user finishes Joyride on "/", we store "/" in completedTours,
   * so next time they visit "/", the Joyride won't run.
   */
  type JoyrideContextValue = {
    skipAllJoyrides: boolean;
    setSkipAllJoyrides: (val: boolean) => void; 
  
    // Which routes the user has completed or skipped
    completedTours: string[];
    markTourAsCompleted: (route: string) => void;
  };
  
  /**
   * Create our Context with defaults that will be overridden in the Provider.
   */
  const JoyrideContext = createContext<JoyrideContextValue>({
    skipAllJoyrides: false,
    setSkipAllJoyrides: () => {},
    completedTours: [],
    markTourAsCompleted: () => {},
  });
  
  export const useJoyrideContext = () => useContext(JoyrideContext);
  
  /**
   * JoyrideProvider
   * 
   * - Single effect to handle both localStorage LOAD & SAVE
   * - Tracks "skipAllJoyrides" + "completedTours"
   * - Exposes "markTourAsCompleted(route)" so once a route is done, we never see it again
   */
  export const JoyrideProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const [initialized, setInitialized] = useState(false);
  
    // If true, user does NOT see any tours in the entire app
    const [skipAllJoyrides, setSkipAllJoyridesState] = useState(false);
  
    // Which routes are already completed. e.g. ["/", "/documents"]
    const [completedTours, setCompletedTours] = useState<string[]>([]);
  
    /**
     * Single effect: 
     *   - On first run => load from localStorage
     *   - Afterwards => save changes
     */
    useEffect(() => {
      if (!initialized) {
        // ========= Load from localStorage =========
        const skip = localStorage.getItem('skipAllJoyrides') === 'true';
        setSkipAllJoyridesState(skip);
  
        const storedTours = localStorage.getItem('completedTours');
        if (storedTours) {
          try {
            setCompletedTours(JSON.parse(storedTours));
          } catch (err) {
            console.error('[JoyrideContext] Invalid storedTours JSON:', err);
          }
        }
  
        setInitialized(true);
      } else {
        // ========= Save to localStorage =========
        localStorage.setItem('skipAllJoyrides', skipAllJoyrides ? 'true' : 'false');
        localStorage.setItem('completedTours', JSON.stringify(completedTours));
      }
    }, [skipAllJoyrides, completedTours, initialized]);
  
    /**
     * Mark a given route's tour as completed so we never show it again.
     */
    const markTourAsCompleted = useCallback(
      (route: string) => {
        if (!completedTours.includes(route)) {
          setCompletedTours((prev) => [...prev, route]);
        }
      },
      [completedTours]
    );
  
    /**
     * Wrap setSkipAllJoyrides so we can do any extra side effects.
     */
    const setSkipAllJoyrides = useCallback((val: boolean) => {
      setSkipAllJoyridesState(val);
    }, []);
  
    const value: JoyrideContextValue = {
      skipAllJoyrides,
      setSkipAllJoyrides,
      completedTours,
      markTourAsCompleted,
    };
  
    return (
      <JoyrideContext.Provider value={value}>
        {children}
      </JoyrideContext.Provider>
    );
  };  