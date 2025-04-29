import { Link } from "react-router";
import { Export } from "../toHtml";

export default function Header() {
  return (
    <Export filename="header" to="link">
      <div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </div>
    </Export>
  );
}
