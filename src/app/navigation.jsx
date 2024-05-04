"use client";

import Link from "next/link";
import { LogoIcon } from "../assets/logo";
import { useGSAP } from "@gsap/react";
import styles from "./navigation.module.scss";
import { useEffect, useRef, useState } from "react";
import { useGlobal } from "./providers";

export function Navigation() {
  // const container = useRef<HTMLLIElement>(null);

  // useGSAP(() => {
  //   container.current.before
  // });

  const setIsWebsiteDimmed = useGlobal((s) => s.setIsWebsiteDimmed);

  const menuElements = ["About", "Solutions", "Resources"];

  const [isMenuExtended, setIsMenuExtended] = useState(false);
  const [isMouseOnExtendedMenu, setIsMouseOnExtendedMenu] = useState(false);

  useEffect(() => {
    setIsWebsiteDimmed(isMenuExtended);
  }, [isMenuExtended]);

  return (
    <div
      className={styles.navigation}
      onMouseEnter={() => setIsMouseOnExtendedMenu(true)}
      onMouseLeave={() => {
        setIsMouseOnExtendedMenu(false);
        setIsMenuExtended(false);
      }}
    >
      <nav>
        <Link href="/" title="Home" target="_blank" rel="noopener noreferrer">
          <LogoIcon width={32} height={32} />
          <span>
            Second <br /> Street
          </span>
        </Link>
        <ul className={styles.menu}>
          {menuElements.map((element) => (
            <MenuElement
              key={element}
              isMenuExtended={isMenuExtended}
              onMouseEnter={() => setIsMenuExtended(true)}
              onMouseLeave={() => {
                return !isMouseOnExtendedMenu && setIsMenuExtended(false);
              }}
            >
              {element}
            </MenuElement>
          ))}
        </ul>
        <button className={styles.mobile} aria-label="Toggle mobile menu">
          <span />
        </button>
        <button className={styles.desktop}>Request A Demo</button>
      </nav>
      <div
        className={`${styles.navigationExpanded} ${
          isMenuExtended ? styles.navigationExpanded__expanded : ""
        }`}
      ></div>
    </div>
  );
}

function MenuElement({ children, isMenuExtended, ...rest }) {
  return (
    <li {...rest}>
      <span
        style={{
          height: isMenuExtended ? "700%" : "100%",
        }}
      ></span>
      <span>{children}</span>
    </li>
  );
}
