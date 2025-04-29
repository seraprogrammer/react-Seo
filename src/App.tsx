import { Export } from "./toHtml";
import Hello from "./Hello";

export default function App() {
  return (
    <>
      <Export filename="home-page">
        <h1>Hello World</h1>
        <p>This content will be extracted for SEO purposes.</p>
      </Export>
      <Hello />
    </>
  );
}
