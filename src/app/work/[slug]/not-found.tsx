import Link from "next/link";
import "./case-study.css";

export default function ProjectNotFound() {
  return (
    <section className="home-section case-missing">
      <h1>Project not found</h1>
      <p>This case study isn’t in the catalogue.</p>
      <Link className="home-action" href="/work">
        Back to Work
      </Link>
    </section>
  );
}
