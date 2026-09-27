import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Footer({ linkedInUrl, githubUrl }: { linkedInUrl: string; githubUrl: string }) {
  return (
    <footer className="site-footer">
      <Link href="/#top" className="site-footer-brand">
        Freemancodz<span>From first click to what happens next.</span>
      </Link>
      <div className="site-footer-links">
        {linkedInUrl && (
          <a href={linkedInUrl} target="_blank" rel="noreferrer">
            LinkedIn
            <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        )}
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noreferrer">
            GitHub
            <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        )}
        <Link href="/#top">Back to top ↑</Link>
      </div>
      <p>© 2026 Freeman Madudili</p>
    </footer>
  );
}
