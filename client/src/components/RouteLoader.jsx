import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function RouteLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 420);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="route-loading-bar" aria-hidden="true">
      <span />
    </div>
  );
}

export default RouteLoader;
