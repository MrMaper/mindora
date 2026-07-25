import * as React from "react";

function useToastPosition() {
  const [position, setPosition] = React.useState<
    "bottom-left" | "bottom-right"
  >("bottom-left");

  React.useEffect(() => {
    const checkDir = () => {
      const dir = document.documentElement.getAttribute("dir");
      setPosition(dir === "rtl" ? "bottom-left" : "bottom-right");
    };
    checkDir();
    const observer = new MutationObserver(checkDir);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });
    return () => observer.disconnect();
  }, []);

  return position;
}

export { useToastPosition };
