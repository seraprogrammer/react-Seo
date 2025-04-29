import { Export } from "./toHtml";

export default function Hello() {
  return (
    <Export filename="hello">
      <div>Hello</div>
    </Export>
  );
}
