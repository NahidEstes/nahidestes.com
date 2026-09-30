import { Header } from "./header";
import { Footer } from "./footer";
export function PublicShell({ children, inner = true }: { children: React.ReactNode; inner?: boolean }) { return <><Header inner={inner}/><main>{children}</main><Footer/></>; }
