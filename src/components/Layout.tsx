import type { ReactNode } from "react";
import { Footer } from "./Footer"; import { Navbar } from "./Navbar";
export function Layout({ children }: { children: ReactNode }){ return <><Navbar/><main>{children}</main><Footer/></> }
