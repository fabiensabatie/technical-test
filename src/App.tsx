// In your App.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Block } from "./block";
import "./styles.css";

interface MountAPI {
  updateProps: (props: any) => void;
  unmount: () => void;
  getProps: () => any;
  onPropsChange: (callback: (props: any) => void) => void;
}

export function mount(container: HTMLElement, initialProps?: any): MountAPI {
  const root = ReactDOM.createRoot(container);
  let currentProps = initialProps || {};
  let propChangeListener: ((props: any) => void) | null = null;

  const App = () => {
    const [props, setProps] = React.useState(currentProps);

    // Handle visual settings changes from the Block component
    const handleVisualSettingsChange = React.useCallback((newSettings: any) => {
      setProps((currentPropsState: any) => {
        const updatedProps = { ...currentPropsState, ...newSettings };
        currentProps = updatedProps;

        console.log(
          "App.tsx: Visual settings changed, notifying playground:",
          updatedProps
        );

        // Notify the playground about prop changes
        if (propChangeListener) {
          console.log("App.tsx: Calling propChangeListener");
          propChangeListener(updatedProps);
        } else {
          console.log("App.tsx: No propChangeListener registered");
        }

        return updatedProps;
      });
    }, []);

    // Expose setProps to the API
    React.useEffect(() => {
      (window as any).__updateProps = setProps;
    }, []);

    return (
      <Block {...props} onVisualSettingsChange={handleVisualSettingsChange} />
    );
  };

  root.render(<App />);

  return {
    updateProps: (newProps: any) => {
      currentProps = { ...currentProps, ...newProps };
      if ((window as any).__updateProps) {
        (window as any).__updateProps(currentProps);
      }
    },
    unmount: () => {
      delete (window as any).__updateProps;
      root.unmount();
    },
    getProps: () => currentProps,
    onPropsChange: (callback: (props: any) => void) => {
      propChangeListener = callback;
    },
  };
}

export default mount;
