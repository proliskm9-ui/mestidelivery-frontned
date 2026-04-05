import React, { useEffect, useRef, useState } from "react";
import "./LoadingOverlay.css";

import logo from "./assets/logo.png";
import mountainsBg from "./assets/mountains-background.png";
import mountainsFg from "./assets/mountains-foreground.png";
import villageFg from "./assets/village-foreground.png";
import villageBg from "./assets/village-background.png";

export default function LoadingOverlay({ ready }) {
  const ref = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (ready !== undefined) return;
    const t = setTimeout(() => {
      ref.current?.classList.add("loading-hide");
    }, 2500);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    ref.current?.classList.add("loading-hide");
  }, [ready]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnd = (e) => {
      if (e.animationName === "loadingOut") setGone(true);
    };
    el.addEventListener("animationend", onEnd);
    return () => el.removeEventListener("animationend", onEnd);
  }, []);

  if (gone) return null;

  return (
    <div ref={ref} className="loading-viewport" aria-hidden="true">
      <div className="loading-phone">
        {/* ЛОГО */}
        <img className="loading-logo" src={logo} alt="logo" />

        {/* СЦЕНА СНИЗУ */}
        <div className="scene">
          <img className="layer layer-mountains-bg" src={mountainsBg} alt="" />
          <img className="layer layer-mountains-fg" src={mountainsFg} alt="" />

          <img className="layer layer-village-bg" src={villageBg} alt="" />
          <img className="layer layer-village-fg" src={villageFg} alt="" />
        </div>
      </div>
    </div>
  );
}
